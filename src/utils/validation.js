/**
 * Input validation and sanitization utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Phone validation (basic international format)
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// Sanitize string input (remove script tags and dangerous content)
export function sanitizeString(input, maxLength = 5000) {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Basic XSS prevention - remove script tags and event handlers
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  
  return sanitized;
}

// Sanitize HTML content (for rich text)
export function sanitizeHtml(input, maxLength = 10000) {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Only allow specific safe HTML tags
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'];
  
  // Remove all tags except allowed ones
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tag) => {
    const lowerTag = tag.toLowerCase();
    if (allowedTags.includes(lowerTag)) {
      // For anchor tags, only allow http/https hrefs
      if (lowerTag === 'a') {
        return match.replace(/href=["']([^"']*)["']/i, (hrefMatch, url) => {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return `href="${url}" target="_blank" rel="noopener noreferrer"`;
          }
          return 'href="#"';
        });
      }
      return match;
    }
    return '';
  });
  
  return sanitized;
}

// Validate email
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

// Validate URL
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return URL_REGEX.test(url.trim());
}

// Validate phone number
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.replace(/\s/g, ''));
}

// Validate password strength
export function validatePassword(password) {
  const result = {
    isValid: false,
    errors: [],
  };
  
  if (!password || typeof password !== 'string') {
    result.errors.push('Password is required');
    return result;
  }
  
  if (password.length < 8) {
    result.errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    result.errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
  }
  
  result.isValid = result.errors.length === 0;
  return result;
}

// Validate listing data
export function validateListingData(data) {
  const errors = [];
  
  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required');
  } else {
    const title = data.title.trim();
    if (title.length < 3) errors.push('Title must be at least 3 characters');
    if (title.length > 200) errors.push('Title must be less than 200 characters');
  }
  
  // Description validation
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required');
  } else {
    const desc = data.description.trim();
    if (desc.length < 20) errors.push('Description must be at least 20 characters');
    if (desc.length > 5000) errors.push('Description must be less than 5000 characters');
  }
  
  // Location validation
  if (!data.locationId) {
    errors.push('Location is required');
  }
  
  // Rates validation (optional but if provided, must be valid numbers)
  if (data.rates) {
    const rateFields = ['hourly', 'twoHour', 'halfDay', 'fullDay'];
    rateFields.forEach(field => {
      const value = data.rates[field];
      if (value && (isNaN(value) || Number(value) < 0 || Number(value) > 100000)) {
        errors.push(`${field} rate must be a valid number between 0 and 100000`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate profile data
export function validateProfileData(data) {
  const errors = [];
  
  // Display name
  if (data.display_name) {
    const name = data.display_name.trim();
    if (name.length < 2) errors.push('Display name must be at least 2 characters');
    if (name.length > 100) errors.push('Display name must be less than 100 characters');
  }
  
  // Bio
  if (data.bio) {
    const bio = data.bio.trim();
    if (bio.length > 2000) errors.push('Bio must be less than 2000 characters');
  }
  
  // Email
  if (data.contact_email && !isValidEmail(data.contact_email)) {
    errors.push('Invalid contact email format');
  }
  
  // Phone
  if (data.contact_phone && !isValidPhone(data.contact_phone)) {
    errors.push('Invalid phone number format');
  }
  
  // Website
  if (data.website && !isValidUrl(data.website)) {
    errors.push('Invalid website URL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Sanitize object recursively
export function sanitizeObject(obj, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return obj;
  
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth, currentDepth + 1));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize keys too (prevent prototype pollution)
    const safeKey = typeof key === 'string' ? sanitizeString(key, 100) : key;
    if (safeKey && !safeKey.startsWith('__')) { // Skip dunder keys
      sanitized[safeKey] = sanitizeObject(value, maxDepth, currentDepth + 1);
    }
  }
  
  return sanitized;
}
