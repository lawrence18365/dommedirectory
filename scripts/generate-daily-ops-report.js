#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { DateTime } = require('luxon');

const CONTACT_EVENT_TYPES = [
  'contact_email_click',
  'contact_phone_click',
  'contact_website_click',
  'contact_booking_click',
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    const next = args[i + 1];

    if (current.startsWith('--') && next && !next.startsWith('--')) {
      parsed[current.slice(2)] = next;
      i += 1;
    }
  }

  return parsed;
};

const isDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const median = (numbers) => {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return 'n/a';
  }

  if (minutes < 60) {
    return `${minutes.toFixed(1)} min`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(2)} h`;
};

const countWithChunkedIn = async ({
  supabase,
  table,
  inColumn,
  inValues,
  extraFilters,
  chunkSize = 150,
}) => {
  if (inValues.length === 0) return 0;

  let total = 0;
  const groups = chunk(inValues, chunkSize);

  for (const values of groups) {
    let query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .in(inColumn, values);

    query = extraFilters(query);

    // eslint-disable-next-line no-await-in-loop
    const { count, error } = await query;
    if (error) {
      throw new Error(`Failed counting ${table}: ${error.message}`);
    }

    total += count || 0;
  }

  return total;
};

const selectWithChunkedIn = async ({
  supabase,
  table,
  select,
  inColumn,
  inValues,
  extraFilters,
  chunkSize = 150,
}) => {
  if (inValues.length === 0) return [];

  const rows = [];
  const groups = chunk(inValues, chunkSize);

  for (const values of groups) {
    let query = supabase
      .from(table)
      .select(select)
      .in(inColumn, values);

    query = extraFilters(query);

    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed selecting ${table}: ${error.message}`);
    }

    if (data?.length) {
      rows.push(...data);
    }
  }

  return rows;
};

const loadPrimaryMetro = (rootDir) => {
  const configPath = path.resolve(rootDir, 'docs', 'ops', 'primary-metro.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing primary metro config at ${configPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!parsed.locationId || !parsed.displayName) {
    throw new Error('primary-metro.json requires locationId and displayName');
  }

  return parsed;
};

const main = async () => {
  const rootDir = process.cwd();
  const args = parseArgs();
  const metro = loadPrimaryMetro(rootDir);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required env vars: SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  const runAt = new Date();
  const zone = metro.timezone || 'UTC';
  const reportDate = args.report_date || DateTime.now().setZone(zone).toISODate();
  if (!isDateString(reportDate)) {
    throw new Error('report_date must be YYYY-MM-DD');
  }

  const reportDateInZone = DateTime.fromISO(reportDate, { zone });
  if (!reportDateInZone.isValid) {
    throw new Error(`Invalid report_date for timezone ${zone}: ${reportDate}`);
  }

  const activityDate = args.activity_date || reportDateInZone.minus({ days: 1 }).toISODate();
  if (!isDateString(activityDate)) {
    throw new Error('activity_date must be YYYY-MM-DD');
  }

  const activityStartInZone = DateTime.fromISO(activityDate, { zone }).startOf('day');
  if (!activityStartInZone.isValid) {
    throw new Error(`Invalid activity_date for timezone ${zone}: ${activityDate}`);
  }

  const outreachCount = toNumber(args.outreaches || process.env.OPS_OUTREACHES, 0);
  const followUpCount = toNumber(args.follow_ups || process.env.OPS_FOLLOW_UPS, 0);

  const start = activityStartInZone.toUTC();
  const end = start.plus({ days: 1 });
  const sevenStart = start.minus({ days: 6 });

  const startIso = start.toISO();
  const endIso = end.toISO();
  const sevenDayStartIso = sevenStart.toISO();
  const startMs = start.toMillis();
  const endMs = end.toMillis();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, city, state, country')
    .eq('id', metro.locationId)
    .maybeSingle();

  if (locationError) {
    throw new Error(`Failed to load locked metro: ${locationError.message}`);
  }

  if (!location) {
    throw new Error(`Locked metro location not found: ${metro.locationId}`);
  }

  const { data: cityListings, error: listingsError } = await supabase
    .from('listings')
    .select('id, profile_id, is_active, created_at')
    .eq('location_id', metro.locationId)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (listingsError) {
    throw new Error(`Failed to load city listings: ${listingsError.message}`);
  }

  // --- supply checks (global + locked metro) ---
  const { count: globalActiveListingsCount, error: globalCountErr } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (globalCountErr) {
    throw new Error(`Failed to count global active listings: ${globalCountErr.message}`);
  }

  const listings = cityListings || [];
  const lockedMetroListingsCount = listings.length;
  const blockedGlobal = (globalActiveListingsCount || 0) === 0;
  const blockedLockedMetro = !blockedGlobal && lockedMetroListingsCount === 0;

  const activeListings = listings.filter((listing) => listing.is_active);
  const listingIds = [...new Set(listings.map((listing) => listing.id))];
  const activeProfileIds = [
    ...new Set(
      activeListings
        .map((listing) => listing.profile_id)
        .filter(Boolean)
    ),
  ];

  const onboardedProvidersYesterday =
    listings.length === 0
      ? 0
      : new Set(
          listings
            .filter((listing) => {
              const createdMs = new Date(listing.created_at).getTime();
              return Number.isFinite(createdMs) && createdMs >= startMs && createdMs < endMs;
            })
            .map((listing) => listing.profile_id)
            .filter(Boolean)
        ).size;

  // If blocked, write the report artifact and exit non-zero.
  if (blockedGlobal || blockedLockedMetro) {
    const reason = blockedGlobal
      ? 'GLOBAL PRE-SUPPLY: listings.is_active=true is 0 across production'
      : `METRO LOCK EMPTY: locked metro ${metro.displayName} (${metro.locationId}) has 0 listings; update docs/ops/primary-metro.json`;

    const reportLines = [
      `# Daily Ops Report - ${reportDate}`,
      '',
      `- Generated at (UTC): ${runAt.toISOString()}`,
      `- Primary metro (locked): ${metro.displayName}`,
      `- Metro timezone: ${zone}`,
      `- Metro location id: \`${metro.locationId}\``,
      `- Activity window (${zone}): ${activityDate} 00:00 -> ${activityDate} 23:59:59`,
      `- Activity window (UTC): ${startIso} to ${endIso}`,
      '',
      '## Status',
      '- STATUS: **BLOCKED**',
      `- Reason: ${reason}`,
      `- Global active listings: ${globalActiveListingsCount || 0}`,
      `- Locked metro listings: ${lockedMetroListingsCount}`,
      '',
      '## Growth',
      `- Outreaches: ${outreachCount}`,
      `- Follow-ups: ${followUpCount}`,
      `- Onboarded providers (new listing creators in window): ${onboardedProvidersYesterday}`,
      '',
      '## Supply + Trust',
      `- Providers with active listings (total): ${activeProfileIds.length}`,
      '- Verified providers (active listings): 0',
      '- Referral links created (new share code events): 0',
      '- Reports filed: 0',
      '- Reports triaged: 0',
      '- Avg triage time: n/a',
      '- Median triage time: n/a',
      '- Triage <= 12h SLA: n/a',
      '',
      '## Demand',
      '- Contact actions yesterday (email/phone/website/booking clicks): 0',
      '- Contact actions last 7 days: 0',
      '',
      '## Targets (single-metro gate)',
      `- Listings target: ${activeProfileIds.length}/30`,
      '- Verified target: 0/10',
      '- Contact actions (7d) target: 0/10',
      '',
      '## Notes',
      '- This report is BLOCKED; KPIs are suppressed to prevent misleading zeros.',
      '- Next action: create at least 1 active listing in production (is_active=true).',
      '- If supply exists but locked metro is empty, update docs/ops/primary-metro.json to a metro with listings.',
      '',
    ];

    const outputDir = path.resolve(rootDir, 'docs', 'ops', 'daily');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.resolve(outputDir, `${reportDate}.md`);
    fs.writeFileSync(outputPath, reportLines.join('\n'), 'utf8');
    console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
    process.exit(2);
  }

  const verifiedProviders = await countWithChunkedIn({
    supabase,
    table: 'profiles',
    inColumn: 'id',
    inValues: activeProfileIds,
    extraFilters: (query) => query.eq('is_verified', true),
  });

  const referralLinksCreated = await countWithChunkedIn({
    supabase,
    table: 'referral_link_events',
    inColumn: 'profile_id',
    inValues: activeProfileIds,
    extraFilters: (query) =>
      query
        .gte('created_at', startIso)
        .lt('created_at', endIso),
  });

  const contactActionsYesterday = await countWithChunkedIn({
    supabase,
    table: 'lead_events',
    inColumn: 'listing_id',
    inValues: listingIds,
    extraFilters: (query) =>
      query
        .in('event_type', CONTACT_EVENT_TYPES)
        .gte('created_at', startIso)
        .lt('created_at', endIso),
  });

  const contactActionsSevenDay = await countWithChunkedIn({
    supabase,
    table: 'lead_events',
    inColumn: 'listing_id',
    inValues: listingIds,
    extraFilters: (query) =>
      query
        .in('event_type', CONTACT_EVENT_TYPES)
        .gte('created_at', sevenDayStartIso)
        .lt('created_at', endIso),
  });

  const reportsFiled = await countWithChunkedIn({
    supabase,
    table: 'listing_reports',
    inColumn: 'listing_id',
    inValues: listingIds,
    extraFilters: (query) =>
      query
        .gte('created_at', startIso)
        .lt('created_at', endIso),
  });

  const triagedRows = await selectWithChunkedIn({
    supabase,
    table: 'listing_reports',
    select: 'created_at, reviewed_at',
    inColumn: 'listing_id',
    inValues: listingIds,
    extraFilters: (query) =>
      query
        .not('reviewed_at', 'is', null)
        .gte('reviewed_at', startIso)
        .lt('reviewed_at', endIso),
  });

  const triageMinutes = triagedRows
    .map((row) => {
      const createdMs = new Date(row.created_at).getTime();
      const reviewedMs = new Date(row.reviewed_at).getTime();
      if (!Number.isFinite(createdMs) || !Number.isFinite(reviewedMs) || reviewedMs < createdMs) {
        return null;
      }
      return (reviewedMs - createdMs) / 60000;
    })
    .filter((value) => value !== null);

  const triagedCount = triageMinutes.length;
  const triageAvgMinutes =
    triagedCount > 0
      ? triageMinutes.reduce((sum, value) => sum + value, 0) / triagedCount
      : null;
  const triageMedianMinutes = median(triageMinutes);
  const triagedWithin12hCount = triageMinutes.filter((minutes) => minutes <= 12 * 60).length;
  const triagedWithin12hPct =
    triagedCount > 0 ? (triagedWithin12hCount / triagedCount) * 100 : null;

  const reportLines = [
    `# Daily Ops Report - ${reportDate}`,
    '',
    `- Generated at (UTC): ${runAt.toISOString()}`,
    `- Primary metro (locked): ${metro.displayName}`,
    `- Metro timezone: ${zone}`,
    `- Metro location id: \`${metro.locationId}\``,
    `- Activity window (${zone}): ${activityDate} 00:00 -> ${activityDate} 23:59:59`,
    `- Activity window (UTC): ${startIso} to ${endIso}`,
    '',
    '## Growth',
    `- Outreaches: ${outreachCount}`,
    `- Follow-ups: ${followUpCount}`,
    `- Onboarded providers (new listing creators in window): ${onboardedProvidersYesterday}`,
    '',
    '## Supply + Trust',
    `- Providers with active listings (total): ${activeProfileIds.length}`,
    `- Verified providers (active listings): ${verifiedProviders}`,
    `- Referral links created (new share code events): ${referralLinksCreated}`,
    `- Reports filed: ${reportsFiled}`,
    `- Reports triaged: ${triagedCount}`,
    `- Avg triage time: ${formatMinutes(triageAvgMinutes)}`,
    `- Median triage time: ${formatMinutes(triageMedianMinutes)}`,
    `- Triage <= 12h SLA: ${
      triagedWithin12hPct === null
        ? 'n/a'
        : `${triagedWithin12hCount}/${triagedCount} (${triagedWithin12hPct.toFixed(1)}%)`
    }`,
    '',
    '## Demand',
    `- Contact actions yesterday (email/phone/website/booking clicks): ${contactActionsYesterday}`,
    `- Contact actions last 7 days: ${contactActionsSevenDay}`,
    '',
    '## Targets (single-metro gate)',
    `- Listings target: ${activeProfileIds.length}/30`,
    `- Verified target: ${verifiedProviders}/10`,
    `- Contact actions (7d) target: ${contactActionsSevenDay}/10`,
    '',
    '## Notes',
    '- Growth outreach counts are manual inputs (`--outreaches`, `--follow_ups`) until CRM integration exists.',
    '- Onboarded provider count is based on unique profiles that created listings in the activity window.',
    '',
  ];

  const outputDir = path.resolve(rootDir, 'docs', 'ops', 'daily');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, `${reportDate}.md`);
  fs.writeFileSync(outputPath, reportLines.join('\n'), 'utf8');

  console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
};

main().catch((error) => {
  console.error(`Failed to generate daily ops report: ${error.message}`);
  process.exit(1);
});
