/**
 * API Error Handling Utilities
 * Standardized error handling for API routes
 */

// Custom API Error class
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const ErrorTypes = {
  BAD_REQUEST: { code: 'BAD_REQUEST', statusCode: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', statusCode: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', statusCode: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', statusCode: 404 },
  CONFLICT: { code: 'CONFLICT', statusCode: 409 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', statusCode: 422 },
  RATE_LIMIT: { code: 'RATE_LIMIT', statusCode: 429 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', statusCode: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', statusCode: 503 },
};

// Helper functions for common errors
export const Errors = {
  badRequest: (message = 'Bad request', details = null) => 
    new APIError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message = 'Unauthorized', details = null) => 
    new APIError(message, 401, 'UNAUTHORIZED', details),
  
  forbidden: (message = 'Forbidden', details = null) => 
    new APIError(message, 403, 'FORBIDDEN', details),
  
  notFound: (message = 'Resource not found', details = null) => 
    new APIError(message, 404, 'NOT_FOUND', details),
  
  conflict: (message = 'Resource conflict', details = null) => 
    new APIError(message, 409, 'CONFLICT', details),
  
  validation: (message = 'Validation failed', details = null) => 
    new APIError(message, 422, 'VALIDATION_ERROR', details),
  
  rateLimit: (message = 'Too many requests', details = null) => 
    new APIError(message, 429, 'RATE_LIMIT', details),
  
  internal: (message = 'Internal server error', details = null) => 
    new APIError(message, 500, 'INTERNAL_ERROR', details),
};

// Format error response
export function formatErrorResponse(error) {
  if (error instanceof APIError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  // Handle Supabase errors
  if (error?.code?.startsWith('PGRST') || error?.code?.startsWith('22') || error?.code?.startsWith('23')) {
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'A database error occurred',
        details: process.env.NODE_ENV === 'development' ? error : null,
      },
    };
  }

  // Handle Stripe errors
  if (error?.type?.startsWith('Stripe')) {
    return {
      success: false,
      error: {
        code: 'PAYMENT_ERROR',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'A payment processing error occurred',
        details: process.env.NODE_ENV === 'development' ? error : null,
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : null,
    },
  };
}

// API Route wrapper with error handling
export function withErrorHandler(handler) {
  return async function (req, res) {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      const errorResponse = formatErrorResponse(error);
      const statusCode = error instanceof APIError ? error.statusCode : 500;

      return res.status(statusCode).json(errorResponse);
    }
  };
}

// Async handler wrapper (alternative to withErrorHandler)
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('API Error:', error);

    const errorResponse = formatErrorResponse(error);
    const statusCode = error instanceof APIError ? error.statusCode : 500;

    res.status(statusCode).json(errorResponse);
  });
};

// Validation error helper
export function createValidationErrors(fields) {
  return new APIError(
    'Validation failed',
    422,
    'VALIDATION_ERROR',
    { fields }
  );
}

// Supabase error handler
export function handleSupabaseError(error) {
  if (!error) return null;

  // Map common Supabase error codes
  const errorMap = {
    'PGRST116': Errors.notFound('Resource not found'),
    '23505': Errors.conflict('Resource already exists'),
    '23503': Errors.badRequest('Referenced resource does not exist'),
    '23514': Errors.validation('Check constraint violation'),
    '42501': Errors.forbidden('Permission denied'),
    'PGRST301': Errors.badRequest('Invalid JSON in request'),
  };

  if (errorMap[error.code]) {
    return errorMap[error.code];
  }

  // Default database error
  return Errors.internal('Database operation failed', error.message);
}
