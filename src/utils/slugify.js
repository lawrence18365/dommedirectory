// src/utils/slugify.js

/**
 * Converts a string into a URL-friendly slug.
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes characters that are not alphanumeric or hyphens
 * - Trims leading/trailing hyphens
 * @param {string} text The string to slugify.
 * @returns {string} The slugified string.
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars except hyphen
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

/**
 * Converts a slug back into a more readable string (approximates original).
 * - Replaces hyphens with spaces
 * - Capitalizes the first letter of each word (Title Case)
 * @param {string} slug The slug to unslugify.
 * @returns {string} The unslugified string.
 */
export function unslugify(slug) {
  if (!slug) return '';
  const words = slug.toString().split('-');
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}