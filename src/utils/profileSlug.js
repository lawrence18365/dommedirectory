import { slugify } from './slugify';

const normalizeStoredSlug = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || '';
};

const fallbackSegment = (value, fallback) => {
  const normalized = slugify(
    String(value || '')
      .replace(/[_]+/g, ' ')
      .trim()
  );
  return normalized || fallback;
};

const extractProfileFields = (input = {}) => {
  const profileSource = Array.isArray(input.profiles) ? input.profiles[0] : input.profiles;
  const locationSource = Array.isArray(input.locations) ? input.locations[0] : input.locations;
  const profile = profileSource || {};
  const location = locationSource || {};

  return {
    displayName:
      input.display_name ||
      input.name ||
      profile.display_name ||
      input.title ||
      'profile',
    city: input.city || location.city || input.country || location.country || 'city',
    state: input.state || location.state || input.country || location.country || 'na',
  };
};

export function buildProfileSlug(input = {}) {
  const storedSlug = normalizeStoredSlug(input.slug);
  if (storedSlug) return storedSlug;

  const { displayName, city, state } = extractProfileFields(input);
  const nameSlug = fallbackSegment(displayName, 'profile');
  const citySlug = fallbackSegment(city, 'city');
  const stateSlug = fallbackSegment(state, 'state');
  return `${nameSlug}-${citySlug}-${stateSlug}`;
}

export function buildProfilePath(input = {}) {
  return `/profiles/${buildProfileSlug(input)}`;
}
