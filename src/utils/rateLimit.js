/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a similar distributed store
 */

const rateLimitMap = new Map();

// Default rate limit: 100 requests per 15 minutes
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100;

/**
 * Check if request is within rate limit
 * @param {string} identifier - IP address or user ID
 * @param {Object} options - Rate limiting options
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: Date }
 */
export function checkRateLimit(identifier, options = {}) {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
  
  const now = Date.now();
  const key = identifier;
  
  // Get or create rate limit entry
  let entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(key, entry);
  } else {
    // Increment count
    entry.count += 1;
  }
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetTime: new Date(entry.resetTime),
  };
}

/**
 * Get client IP from request
 * @param {Object} req - Next.js request object
 * @returns {string} - Client IP address
 */
export function getClientIp(req) {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for other common headers
  return req.headers['x-real-ip'] || 
         req.headers['x-client-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

/**
 * Apply rate limiting to a Next.js API route
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {Object} options - Rate limiting options
 * @returns {boolean} - True if request is allowed, false if rate limited
 */
export function applyRateLimit(req, res, options = {}) {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip, options);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', options.maxRequests || DEFAULT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime.getTime() / 1000));
  
  if (!result.allowed) {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
    });
    return false;
  }
  
  return true;
}

// Cleanup old entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000);
