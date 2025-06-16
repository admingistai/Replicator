/**
 * Error handler utility for consistent error handling across the application
 */

// Error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SECURITY_ERROR: 'SECURITY_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages
export const ErrorMessages = {
  [ErrorTypes.VALIDATION_ERROR]: 'Invalid input provided',
  [ErrorTypes.NETWORK_ERROR]: 'Network connection failed',
  [ErrorTypes.TIMEOUT_ERROR]: 'Request timed out',
  [ErrorTypes.SECURITY_ERROR]: 'Security policy violation',
  [ErrorTypes.NOT_FOUND_ERROR]: 'Resource not found',
  [ErrorTypes.SERVER_ERROR]: 'Server error occurred',
  [ErrorTypes.RATE_LIMIT_ERROR]: 'Too many requests',
  [ErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred'
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(type, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Create a standardized error object
 * @param {string} type - Error type from ErrorTypes
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} details - Additional error details
 * @returns {AppError} Standardized error object
 */
export function createError(type, message, statusCode = 500, details = null) {
  return new AppError(type, message, statusCode, details);
}

/**
 * Handle API errors and return appropriate error response
 * @param {Error} error - Error object
 * @returns {Object} Error response object
 */
export function handleApiError(error) {
  console.error('API Error:', error);

  // Handle Axios errors
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    if (status === 404) {
      return {
        type: ErrorTypes.NOT_FOUND_ERROR,
        message: data?.error || 'The requested resource was not found',
        statusCode: 404
      };
    }

    if (status === 429) {
      return {
        type: ErrorTypes.RATE_LIMIT_ERROR,
        message: data?.error || 'Too many requests. Please try again later.',
        statusCode: 429,
        retryAfter: data?.retryAfter
      };
    }

    if (status >= 500) {
      return {
        type: ErrorTypes.SERVER_ERROR,
        message: 'The server encountered an error. Please try again later.',
        statusCode: status
      };
    }

    if (status === 403) {
      return {
        type: ErrorTypes.SECURITY_ERROR,
        message: data?.error || 'Access forbidden',
        statusCode: 403
      };
    }

    return {
      type: ErrorTypes.UNKNOWN_ERROR,
      message: data?.error || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
      statusCode: status
    };
  }

  // Handle network errors
  if (error.request) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: ErrorTypes.TIMEOUT_ERROR,
        message: 'The request timed out. Please try again.',
        statusCode: 408
      };
    }

    return {
      type: ErrorTypes.NETWORK_ERROR,
      message: 'Unable to connect to the server. Please check your connection.',
      statusCode: 503
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.type === ErrorTypes.VALIDATION_ERROR) {
    return {
      type: ErrorTypes.VALIDATION_ERROR,
      message: error.message,
      statusCode: 400,
      details: error.details
    };
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    };
  }

  // Default error
  return {
    type: ErrorTypes.UNKNOWN_ERROR,
    message: error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
    statusCode: 500
  };
}

/**
 * Format error for user display
 * @param {Object} error - Error object
 * @returns {string} User-friendly error message
 */
export function formatErrorForUser(error) {
  const errorResponse = handleApiError(error);

  switch (errorResponse.type) {
    case ErrorTypes.VALIDATION_ERROR:
      return errorResponse.message;
    
    case ErrorTypes.NETWORK_ERROR:
      return 'Unable to connect. Please check your internet connection and try again.';
    
    case ErrorTypes.TIMEOUT_ERROR:
      return 'The request took too long. The website might be slow or unavailable.';
    
    case ErrorTypes.SECURITY_ERROR:
      return 'This website has security restrictions that prevent it from being replicated.';
    
    case ErrorTypes.NOT_FOUND_ERROR:
      return 'The website could not be found. Please check the URL and try again.';
    
    case ErrorTypes.RATE_LIMIT_ERROR:
      return `Too many requests. Please wait ${errorResponse.retryAfter || 60} seconds and try again.`;
    
    case ErrorTypes.SERVER_ERROR:
      return 'A server error occurred. Please try again later.';
    
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Log error for monitoring
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      type: error.type || 'UNKNOWN',
      statusCode: error.statusCode
    },
    context,
    environment: process.env.NODE_ENV || 'development'
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, LogRocket, etc.)
    console.error('Production Error:', JSON.stringify(errorLog));
  } else {
    console.error('Development Error:', errorLog);
  }
}

/**
 * Create error boundary for React components
 */
export class ErrorBoundary {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static componentDidCatch(error, errorInfo) {
    logError(error, { errorInfo });
  }
}