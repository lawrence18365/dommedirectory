export const ALL_SERVICES = [
  'Bondage',
  'Discipline',
  'Domination',
  'Submission',
  'Sadism',
  'Masochism',
  'Roleplay',
  'Fetish',
  'CBT',
  'Spanking',
  'Humiliation',
  'Foot Worship',
  'Pegging',
  'Financial Domination',
  'Sissy Training',
];

export function slugifyService(service) {
  return (service || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build a lookup map from slug → display name
export const SERVICE_BY_SLUG = Object.fromEntries(
  ALL_SERVICES.map((s) => [slugifyService(s), s])
);
