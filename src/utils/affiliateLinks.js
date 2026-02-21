/**
 * Affiliate link builder for content platforms.
 *
 * Reads profile.social_links (JSONB) and optional seed_contact_website,
 * constructs proper platform URLs, and wraps monetisable platforms with
 * affiliate/ref params from environment variables.
 *
 * Env vars (public — these are referral codes, not secrets):
 *   NEXT_PUBLIC_OF_REF      OnlyFans ref code
 *   NEXT_PUBLIC_FANSLY_REF  Fansly ref code
 *   NEXT_PUBLIC_MV_REF      ManyVids affiliate code
 *
 * Usage:
 *   import { buildPlatformLinks } from '../utils/affiliateLinks';
 *   const links = buildPlatformLinks(profile.social_links, listing.seed_contact_website);
 */

// ---------------------------------------------------------------------------
// Platform definitions
// ---------------------------------------------------------------------------

const clean = (handle) =>
  (handle || '')
    .toString()
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?[^/]+\//, '') // strip full URL prefix if someone pasted a full URL
    .split('?')[0]
    .split('/')[0]
    .trim();

const cleanUrl = (url) => {
  url = (url || '').trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
};

// These are the known platform key variations we handle
const PLATFORM_KEYS = {
  onlyfans:    ['onlyfans', 'of', 'onlyfans_url'],
  fansly:      ['fansly', 'fansly_url'],
  twitter:     ['twitter', 'x', 'twitter_url', 'x_url'],
  instagram:   ['instagram', 'ig', 'instagram_url'],
  fetlife:     ['fetlife', 'fetlife_url'],
  clips4sale:  ['clips4sale', 'c4s', 'clips4sale_url'],
  manyvids:    ['manyvids', 'mv', 'manyvids_url'],
  telegram:    ['telegram'],
  linktree:    ['linktree', 'linktr.ee', 'linktree_url'],
  bsky:        ['bsky', 'bluesky', 'bsky_url'],
};

// Platform metadata
const PLATFORMS = {
  onlyfans: {
    label: 'OnlyFans',
    priority: 1,
    monetised: true,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://onlyfans.com/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => {
      const ref = process.env.NEXT_PUBLIC_OF_REF;
      const base = PLATFORMS.onlyfans.buildUrl(val);
      return ref ? `${base}?ref=${ref}` : base;
    },
    badgeColor: 'bg-[#00aff0]/20 text-[#00aff0] border-[#00aff0]/30',
    // Simple inline SVG mark
    icon: (
      `<svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">` +
      `<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 5.838a6.162 6.162 0 1 1 0 12.324A6.162 6.162 0 0 1 12 5.838zm0 2.057a4.105 4.105 0 1 0 0 8.21 4.105 4.105 0 0 0 0-8.21z"/>` +
      `</svg>`
    ),
  },

  fansly: {
    label: 'Fansly',
    priority: 2,
    monetised: true,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://fansly.com/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => {
      const ref = process.env.NEXT_PUBLIC_FANSLY_REF;
      const base = PLATFORMS.fansly.buildUrl(val);
      return ref ? `${base}?ref=${ref}` : base;
    },
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: null,
  },

  twitter: {
    label: 'Twitter / X',
    priority: 3,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://twitter.com/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.twitter.buildUrl(val),
    badgeColor: 'bg-white/10 text-white border-white/20',
    icon: null,
  },

  manyvids: {
    label: 'ManyVids',
    priority: 4,
    monetised: true,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://www.manyvids.com/Profile/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => {
      const ref = process.env.NEXT_PUBLIC_MV_REF;
      const base = PLATFORMS.manyvids.buildUrl(val);
      return ref ? `${base}?afid=${ref}` : base;
    },
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    icon: null,
  },

  clips4sale: {
    label: 'Clips4Sale',
    priority: 5,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://clips4sale.com/studio/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.clips4sale.buildUrl(val),
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: null,
  },

  fetlife: {
    label: 'FetLife',
    priority: 6,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://fetlife.com/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.fetlife.buildUrl(val),
    badgeColor: 'bg-red-800/30 text-red-300 border-red-700/30',
    icon: null,
  },

  instagram: {
    label: 'Instagram',
    priority: 7,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://instagram.com/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.instagram.buildUrl(val),
    badgeColor: 'bg-pink-600/20 text-pink-300 border-pink-600/30',
    icon: null,
  },

  telegram: {
    label: 'Telegram',
    priority: 8,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://t.me/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.telegram.buildUrl(val),
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    icon: null,
  },

  linktree: {
    label: 'Linktree',
    priority: 9,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      return `https://linktr.ee/${clean(val)}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.linktree.buildUrl(val),
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: null,
  },

  bsky: {
    label: 'Bluesky',
    priority: 10,
    monetised: false,
    buildUrl: (val) => {
      if (val.startsWith('http')) return val.split('?')[0];
      const handle = clean(val);
      return `https://bsky.app/profile/${handle.includes('.') ? handle : handle + '.bsky.social'}`;
    },
    buildAffiliateUrl: (val) => PLATFORMS.bsky.buildUrl(val),
    badgeColor: 'bg-sky-600/20 text-sky-300 border-sky-600/30',
    icon: null,
  },
};

// ---------------------------------------------------------------------------
// Reverse-lookup: social_links key → platform id
// ---------------------------------------------------------------------------
const KEY_TO_PLATFORM = {};
Object.entries(PLATFORM_KEYS).forEach(([platformId, keys]) => {
  keys.forEach((k) => {
    KEY_TO_PLATFORM[k.toLowerCase()] = platformId;
  });
});

// ---------------------------------------------------------------------------
// Detect platform from a bare URL (for seed_contact_website)
// ---------------------------------------------------------------------------
const URL_PLATFORM_PATTERNS = [
  { pattern: /onlyfans\.com\//i,   platform: 'onlyfans' },
  { pattern: /fansly\.com\//i,     platform: 'fansly' },
  { pattern: /twitter\.com\//i,    platform: 'twitter' },
  { pattern: /x\.com\//i,          platform: 'twitter' },
  { pattern: /manyvids\.com\//i,   platform: 'manyvids' },
  { pattern: /clips4sale\.com\//i, platform: 'clips4sale' },
  { pattern: /fetlife\.com\//i,    platform: 'fetlife' },
  { pattern: /instagram\.com\//i,  platform: 'instagram' },
  { pattern: /t\.me\//i,           platform: 'telegram' },
  { pattern: /linktr\.ee\//i,      platform: 'linktree' },
  { pattern: /bsky\.app\//i,       platform: 'bsky' },
];

function detectPlatformFromUrl(url) {
  for (const { pattern, platform } of URL_PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Build a sorted list of platform link objects from a profile's social data.
 *
 * @param {Record<string,string>} socialLinks  profile.social_links JSONB
 * @param {string}  [seedWebsite]              listing.seed_contact_website
 * @returns {Array<{
 *   platformId: string,
 *   label: string,
 *   url: string,          // affiliate-wrapped URL to use in <a href>
 *   rawUrl: string,       // plain URL without affiliate params
 *   monetised: boolean,
 *   badgeColor: string,
 *   trackingKey: string,  // use as lead event metadata.platform
 * }>}
 */
export function buildPlatformLinks(socialLinks = {}, seedWebsite = '') {
  const seen = new Set();
  const results = [];

  // Process social_links entries
  Object.entries(socialLinks || {}).forEach(([key, value]) => {
    if (!value) return;
    const platformId = KEY_TO_PLATFORM[key.toLowerCase()];
    if (!platformId || seen.has(platformId)) return;

    const config = PLATFORMS[platformId];
    if (!config) return;

    seen.add(platformId);
    const rawUrl = config.buildUrl(value);
    results.push({
      platformId,
      label: config.label,
      url: config.buildAffiliateUrl(value),
      rawUrl,
      monetised: config.monetised,
      badgeColor: config.badgeColor,
      trackingKey: platformId,
      priority: config.priority,
    });
  });

  // Try to detect platform from seed_contact_website
  if (seedWebsite) {
    const url = cleanUrl(seedWebsite);
    const platformId = detectPlatformFromUrl(url);
    if (platformId && !seen.has(platformId)) {
      const config = PLATFORMS[platformId];
      if (config) {
        seen.add(platformId);
        const affiliateUrl = config.buildAffiliateUrl(url);
        results.push({
          platformId,
          label: config.label,
          url: affiliateUrl,
          rawUrl: url,
          monetised: config.monetised,
          badgeColor: config.badgeColor,
          trackingKey: platformId,
          priority: config.priority,
        });
      }
    }
  }

  return results.sort((a, b) => a.priority - b.priority);
}

/**
 * Extract the Twitter handle from social_links, if any.
 * Returns bare handle (no @) or null.
 */
export function getTwitterHandle(socialLinks = {}) {
  for (const key of ['twitter', 'x', 'twitter_url', 'x_url']) {
    const val = socialLinks[key];
    if (!val) continue;
    if (val.startsWith('http')) {
      const match = val.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
      return match ? match[1] : null;
    }
    return clean(val) || null;
  }
  return null;
}
