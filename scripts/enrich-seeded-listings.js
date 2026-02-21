#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 20000;

const DOMAIN_BLOCKLIST = new Set([
  'tryst.link',
  'discovery.tryst.a4cdn.org',
  'media-v2.tryst.a4cdn.org',
  'assemblyfour.com',
  'tryststatus.link',
  'goodclientguide.com',
  'geonames.org',
  'creativecommons.org',
  'x.com',
  'twitter.com',
  'instagram.com',
  'facebook.com',
  'tiktok.com',
  'youtube.com',
  'linkedin.com',
  'pinterest.com',
]);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    dryRun: false,
    concurrency: DEFAULT_CONCURRENCY,
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

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = decodeEntities(value.trim());
  if (!trimmed) return null;
  if (trimmed.startsWith('/') || trimmed.startsWith('?') || trimmed.startsWith('#')) return null;
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return null;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || !hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const getHostname = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return null;

  try {
    return new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

const getRootDomain = (value) => {
  const hostname = getHostname(value);
  if (!hostname) return null;
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length < 2) return hostname;
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
};

const isBlockedDomain = (value) => {
  const hostname = getHostname(value);
  if (!hostname) return true;
  if (DOMAIN_BLOCKLIST.has(hostname)) return true;
  for (const domain of DOMAIN_BLOCKLIST) {
    if (hostname.endsWith(`.${domain}`)) return true;
  }
  return false;
};

const pickBestWebsite = (html, sourceUrl) => {
  const sourceRoot = getRootDomain(sourceUrl);
  const anchors = [];
  const anchorRegex = /<a\b([^>]*?)href=(['"])(.*?)\2([^>]*)>/gi;

  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const attrs = `${match[1] || ''} ${match[4] || ''}`;
    const href = match[3] || '';
    const normalized = normalizeUrl(href);
    if (!normalized) continue;

    const urlRoot = getRootDomain(normalized);
    if (!urlRoot) continue;
    if (sourceRoot && urlRoot === sourceRoot) continue;
    if (isBlockedDomain(normalized)) continue;

    const attrLower = attrs.toLowerCase();
    const score =
      (attrLower.includes('visit website') ? 100 : 0) +
      (attrLower.includes('provider-analytics-event') ? 50 : 0) +
      (attrLower.includes('website') ? 30 : 0);

    anchors.push({ url: normalized, score });
  }

  if (!anchors.length) return null;

  anchors.sort((a, b) => b.score - a.score);
  return anchors[0].url;
};

const fetchHtml = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

const runPool = async (items, worker, concurrency) => {
  const queue = [...items];
  const results = [];

  const runners = Array.from({ length: Math.max(1, concurrency) }).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const result = await worker(item);
      results.push(result);
    }
  });

  await Promise.all(runners);
  return results;
};

async function main() {
  bootstrapEnv();
  const args = parseArgs();

  const locationId = (args['location-id'] || '').trim();
  if (!locationId) {
    throw new Error('Missing --location-id <uuid>');
  }

  const limit = Number(args.limit || 0) || null;
  const dryRun = Boolean(args.dryRun);
  const concurrency = Math.max(1, Number(args.concurrency || DEFAULT_CONCURRENCY) || DEFAULT_CONCURRENCY);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id,title,location_id,is_seeded,profile_id,is_active,seed_source_url,seed_contact_website')
    .eq('location_id', locationId)
    .eq('is_seeded', true)
    .is('profile_id', null)
    .eq('is_active', true);

  if (listingsError) {
    throw new Error(`Failed to load listings: ${listingsError.message}`);
  }

  const candidates = (listings || [])
    .filter((listing) => !(listing.seed_contact_website || '').trim())
    .filter((listing) => (listing.seed_source_url || '').trim().length > 0);

  const workItems = limit ? candidates.slice(0, limit) : candidates;

  console.log(`seeded_unclaimed_active=${listings?.length || 0}`);
  console.log(`candidates_missing_website=${candidates.length}`);
  console.log(`processing=${workItems.length}`);

  const scraped = await runPool(
    workItems,
    async (listing) => {
      try {
        const html = await fetchHtml(listing.seed_source_url);
        const website = pickBestWebsite(html, listing.seed_source_url);
        return {
          id: listing.id,
          source: listing.seed_source_url,
          website,
          ok: Boolean(website),
          error: null,
        };
      } catch (error) {
        return {
          id: listing.id,
          source: listing.seed_source_url,
          website: null,
          ok: false,
          error: error.message || 'fetch_failed',
        };
      }
    },
    concurrency
  );

  const updates = scraped.filter((item) => item.ok && item.website);
  const failures = scraped.filter((item) => !item.ok);

  if (dryRun) {
    console.log(`dry_run_updates=${updates.length}`);
    console.log(`dry_run_failures=${failures.length}`);
    for (const sample of updates.slice(0, 5)) {
      console.log(`sample_update id=${sample.id} website=${sample.website}`);
    }
    return;
  }

  let applied = 0;
  for (const item of updates) {
    const { error } = await supabase
      .from('listings')
      .update({
        seed_contact_website: item.website,
      })
      .eq('id', item.id)
      .is('profile_id', null)
      .eq('is_seeded', true)
      .eq('is_active', true);

    if (error) {
      console.error(`update_failed id=${item.id} error=${error.message}`);
      continue;
    }
    applied += 1;
  }

  console.log(`websites_found=${updates.length}`);
  console.log(`updates_applied=${applied}`);
  console.log(`failures=${failures.length}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
