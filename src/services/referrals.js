const REFERRAL_STORAGE_KEY = 'dd_referral_attribution_v1';
const REFERRAL_COOKIE_KEY = 'dd_referral_attribution_v1';
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const safeJsonParse = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const encodedName = encodeURIComponent(name);
  const segments = document.cookie.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (trimmed.startsWith(`${encodedName}=`)) {
      return decodeURIComponent(trimmed.slice(encodedName.length + 1));
    }
  }
  return null;
};

const writeCookie = (name, value, maxAgeSeconds = 60 * 60 * 24 * 30) => {
  if (typeof document === 'undefined') return;
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${encodedName}=${encodedValue}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  const encodedName = encodeURIComponent(name);
  document.cookie = `${encodedName}=; path=/; max-age=0; samesite=lax`;
};

const isExpired = (entry) => {
  if (!entry?.captured_at) return true;
  const capturedAt = new Date(entry.captured_at).getTime();
  if (!Number.isFinite(capturedAt)) return true;
  return Date.now() - capturedAt > REFERRAL_TTL_MS;
};

const normalizeSourceCity = (pathname, searchParams) => {
  if (!pathname) return null;

  if (pathname.startsWith('/location/')) {
    const slug = pathname.split('/')[2] || '';
    if (!slug) return null;
    return slug
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const cityQuery = searchParams.get('q');
  if (cityQuery) return cityQuery.trim();

  return null;
};

const persistAttribution = (entry) => {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(entry);
  window.localStorage.setItem(REFERRAL_STORAGE_KEY, serialized);
  writeCookie(REFERRAL_COOKIE_KEY, serialized);
};

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  if (!entry.event_code || !entry.share_code) return null;
  if (isExpired(entry)) return null;
  return entry;
};

export function getReferralAttribution() {
  if (typeof window === 'undefined') return null;

  const fromStorage = safeJsonParse(window.localStorage.getItem(REFERRAL_STORAGE_KEY));
  const normalizedStorage = normalizeEntry(fromStorage);
  if (normalizedStorage) {
    return normalizedStorage;
  }

  const fromCookie = safeJsonParse(readCookie(REFERRAL_COOKIE_KEY));
  const normalizedCookie = normalizeEntry(fromCookie);
  if (normalizedCookie) {
    persistAttribution(normalizedCookie);
    return normalizedCookie;
  }

  clearReferralAttribution();
  return null;
}

export function clearReferralAttribution() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  }
  deleteCookie(REFERRAL_COOKIE_KEY);
}

export function getReferralSignupMetadata() {
  const attribution = getReferralAttribution();
  if (!attribution) return {};

  return {
    referral_event_code: attribution.event_code,
    referral_source_city: attribution.source_city || null,
    referral_utm_source: attribution.utm_source || null,
    referral_utm_medium: attribution.utm_medium || null,
    referral_utm_campaign: attribution.utm_campaign || null,
  };
}

export async function captureReferralAttributionFromUrl() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const shareCode = (params.get('ref') || '').trim().toLowerCase();
  if (!shareCode) return null;

  const existing = getReferralAttribution();
  if (existing && existing.share_code === shareCode) {
    return existing;
  }

  const sourceCity = normalizeSourceCity(window.location.pathname, params);
  const payload = {
    shareCode,
    sourceCity,
    pagePath: window.location.pathname,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };

  try {
    const response = await fetch('/api/referrals/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    const result = await response.json();
    if (!result?.referralEventCode) return null;

    const entry = {
      share_code: shareCode,
      event_code: result.referralEventCode,
      source_city: sourceCity,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      captured_at: new Date().toISOString(),
    };

    persistAttribution(entry);
    return entry;
  } catch {
    return null;
  }
}
