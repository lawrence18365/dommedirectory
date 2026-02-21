const BUSINESS_LOCAL_TOKENS = [
  'info',
  'hello',
  'contact',
  'bookings',
  'booking',
  'admin',
  'support',
  'sales',
  'studio',
  'team',
  'concierge',
];

const PERSONAL_OR_FREE_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

const isHttpUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = new URL(value.trim());
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const normalizeEmail = (value) => {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return null;
  return normalized;
};

const getRootDomain = (value) => {
  if (!value) return null;

  try {
    const parsed = value.includes('://') ? new URL(value) : new URL(`https://${value}`);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const segments = hostname.split('.').filter(Boolean);
    if (segments.length < 2) return hostname;
    return `${segments[segments.length - 2]}.${segments[segments.length - 1]}`;
  } catch {
    return null;
  }
};

const hasBusinessLocalToken = (localPart) =>
  BUSINESS_LOCAL_TOKENS.some((token) => localPart.includes(token));

export const isPublicBusinessEmail = ({
  email,
  sourceUrl,
  websiteUrl = null,
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  // Source-proven requirement.
  if (!isHttpUrl(sourceUrl)) {
    return false;
  }

  const [localPart, domain] = normalizedEmail.split('@');
  if (!localPart || !domain) return false;

  const normalizedLocal = localPart.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  const hasBusinessToken = hasBusinessLocalToken(normalizedLocal);

  const emailRoot = getRootDomain(normalizedDomain);
  const websiteRoot = getRootDomain(websiteUrl || '');
  const sameBusinessDomain = Boolean(emailRoot && websiteRoot && emailRoot === websiteRoot);

  if (/(student|personal)/i.test(normalizedLocal)) {
    return false;
  }

  if (PERSONAL_OR_FREE_DOMAINS.has(normalizedDomain) && !sameBusinessDomain) {
    return false;
  }

  const looksPersonalPattern = /^[a-z]+([._-][a-z]+)?$/i.test(normalizedLocal);
  if (looksPersonalPattern && !hasBusinessToken && !sameBusinessDomain) {
    return false;
  }

  return hasBusinessToken || sameBusinessDomain;
};

export const getSafePublicUrl = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};
