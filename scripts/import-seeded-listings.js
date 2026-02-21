#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BATCH_SIZE = 100;
const FETCH_BATCH_SIZE = 1000;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    const next = args[i + 1];

    if (current === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (current.startsWith('--') && next && !next.startsWith('--')) {
      parsed[current.slice(2)] = next;
      i += 1;
    }
  }

  return parsed;
};

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

const bootstrapEnv = () => {
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.local'));
};

const toLowerTrim = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const normalizeEmail = (value) => {
  const email = toLowerTrim(value);
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
};

const normalizeHandle = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const pathSegment = parsed.pathname
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .pop();
      return pathSegment ? pathSegment.replace(/^@+/, '').toLowerCase() : null;
    } catch {
      return null;
    }
  }

  return trimmed.replace(/^@+/, '').toLowerCase();
};

const normalizeUrl = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const getRootDomain = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const parts = host.split('.').filter(Boolean);
    if (parts.length < 2) return host;
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  } catch {
    return null;
  }
};

const normalizeKeyText = (value) =>
  (typeof value === 'string' ? value.trim().toLowerCase() : '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildCanonicalKey = ({ title, sourceUrl, website, handle, email }) => {
  const websiteDomain = getRootDomain(website);
  if (websiteDomain) return `website:${websiteDomain}`;

  const normalizedHandle = normalizeHandle(handle);
  if (normalizedHandle) return `handle:${normalizedHandle}`;

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) return `email:${normalizedEmail}`;

  const normalizedTitle = normalizeKeyText(title);
  const normalizedSource = normalizeUrl(sourceUrl) || normalizeKeyText(sourceUrl);
  return `fallback:${normalizedTitle}|${normalizedSource}`;
};

const parseCsv = (raw) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((value) => String(value || '').trim().length > 0));
};

const chunk = (items, size) => {
  const output = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
};

const loadCsvRows = (csvPath) => {
  const resolved = path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`CSV file not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf8');
  const parsedRows = parseCsv(raw);
  if (parsedRows.length < 2) {
    throw new Error('CSV must include a header row and at least one data row.');
  }

  const header = parsedRows[0].map((column) => normalizeKeyText(column).replace(/\s+/g, '_'));
  const records = parsedRows.slice(1).map((columns, rowIndex) => {
    const row = {};
    header.forEach((key, idx) => {
      row[key] = typeof columns[idx] === 'string' ? columns[idx].trim() : '';
    });
    row.__row = rowIndex + 2;
    return row;
  });

  return { records, resolved };
};

const fetchExistingListings = async (supabase) => {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('listings')
      .select('id,title,seed_source_url,seed_contact_website,seed_contact_handle,seed_contact_email')
      .eq('is_seeded', true)
      .range(from, from + FETCH_BATCH_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch existing listings: ${error.message}`);
    }

    rows.push(...(data || []));
    if (!data || data.length < FETCH_BATCH_SIZE) break;
    from += FETCH_BATCH_SIZE;
  }

  return rows;
};

const assertLocationExists = async (supabase, locationId) => {
  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .eq('id', locationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to validate location_id ${locationId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`location_id ${locationId} was not found in locations.`);
  }
};

async function main() {
  bootstrapEnv();

  const args = parseArgs();
  const csvPath = args.csv || args.file;
  if (!csvPath) {
    throw new Error(
      'Missing --csv path/to/file.csv. Usage: npm run seed:unclaimed -- --csv ./data/toronto.csv --location-id <uuid> [--source-label public_web_seed] [--dry-run]'
    );
  }

  const locationOverride = (args['location-id'] || '').trim() || null;
  const defaultSourceLabel = (args['source-label'] || '').trim() || 'public_web_seed';
  const limit = Number(args.limit || 0) || null;
  const dryRun = Boolean(args.dryRun);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { records, resolved } = loadCsvRows(csvPath);
  const existingListings = await fetchExistingListings(supabase);
  const existingKeys = new Set(
    existingListings
      .map((listing) =>
        buildCanonicalKey({
          title: listing.title,
          sourceUrl: listing.seed_source_url,
          website: listing.seed_contact_website,
          handle: listing.seed_contact_handle,
          email: listing.seed_contact_email,
        })
      )
      .filter(Boolean)
  );

  const inserts = [];
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  for (const record of records) {
    if (limit && inserts.length >= limit) break;

    const title = (record.title || '').trim();
    const sourceUrl = normalizeUrl(record.seed_source_url || record.source_url || record.source);
    const email = normalizeEmail(record.seed_contact_email || record.email || record.contact_email);
    const website = normalizeUrl(record.seed_contact_website || record.website || record.contact_website);
    const handle = normalizeHandle(record.seed_contact_handle || record.handle || record.contact_handle);
    const locationId = locationOverride || (record.location_id || '').trim();
    const sourceLabel = (record.seed_source_label || record.source_label || defaultSourceLabel).trim() || defaultSourceLabel;
    const description = (record.description || '').trim() || null;

    const hasReachableContact = Boolean(email || website || handle);

    if (!title || !sourceUrl || !locationId || !hasReachableContact) {
      skippedInvalid += 1;
      continue;
    }

    const key = buildCanonicalKey({
      title,
      sourceUrl,
      website,
      handle,
      email,
    });

    if (existingKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }

    existingKeys.add(key);
    inserts.push({
      profile_id: null,
      location_id: locationId,
      title,
      description,
      services: {},
      rates: {},
      is_active: true,
      is_seeded: true,
      seed_source_url: sourceUrl,
      seed_source_label: sourceLabel,
      seed_contact_email: email,
      seed_contact_website: website,
      seed_contact_handle: handle ? `@${handle}` : null,
    });
  }

  if (locationOverride) {
    await assertLocationExists(supabase, locationOverride);
  }

  if (dryRun) {
    console.log(`CSV: ${resolved}`);
    console.log(`Dry run. Prepared ${inserts.length} inserts.`);
    console.log(`Skipped duplicates: ${skippedDuplicates}`);
    console.log(`Skipped invalid rows: ${skippedInvalid}`);
    return;
  }

  let inserted = 0;
  const batches = chunk(inserts, BATCH_SIZE);
  for (const batch of batches) {
    const { error } = await supabase.from('listings').insert(batch);
    if (error) {
      throw new Error(`Failed to insert seeded listings: ${error.message}`);
    }
    inserted += batch.length;
  }

  console.log(`CSV: ${resolved}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped duplicates: ${skippedDuplicates}`);
  console.log(`Skipped invalid rows: ${skippedInvalid}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
