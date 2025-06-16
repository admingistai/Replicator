class ErrorLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log an error with context
   * @param {Error} error - The error object
   * @param {Object} req - The request object
   * @param {Object} additionalContext - Additional context to log
   */
  log(error, req, additionalContext = {}) {
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      level: 'error',
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined,
      request: {
        method: req.method,
        url: req.url,
        query: this.sanitizeUrl(req.query),
        headers: this.sanitizeHeaders(req.headers),
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      },
      error: {
        name: error.name,
        code: error.code,
        statusCode: error.response?.status,
        response: error.response?.data ? this.truncate(error.response.data) : undefined
      },
      ...additionalContext
    };

    // In production, you would send this to a logging service
    // For now, we'll just console.error it
    console.error(JSON.stringify(errorLog, null, 2));

    // You could also send to monitoring services like Sentry, LogRocket, etc.
    if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
      // Server-side Sentry integration would go here
    }
  }

  /**
   * Log a warning
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    const timestamp = new Date().toISOString();
    const warnLog = {
      timestamp,
      level: 'warn',
      message,
      ...context
    };

    console.warn(JSON.stringify(warnLog, null, 2));
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const infoLog = {
        timestamp,
        level: 'info',
        message,
        ...context
      };

      console.info(JSON.stringify(infoLog, null, 2));
    }
  }

  /**
   * Sanitize URL query parameters to remove sensitive data
   * @param {Object} query - Query parameters
   * @returns {Object} Sanitized query
   */
  sanitizeUrl(query) {
    if (!query) return {};
    
    const sanitized = { ...query };
    
    // Remove sensitive parameters
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
    sensitiveParams.forEach(param => {
      if (sanitized[param]) {
        sanitized[param] = '[REDACTED]';
      }
    });

    // Truncate very long URLs
    if (sanitized.url && sanitized.url.length > 200) {
      sanitized.url = sanitized.url.substring(0, 200) + '...[TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Sanitize headers to remove sensitive data
   * @param {Object} headers - Request headers
   * @returns {Object} Sanitized headers
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token'
    ];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Truncate long strings for logging
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  truncate(str, maxLength = 1000) {
    if (typeof str !== 'string') {
      str = JSON.stringify(str);
    }
    
    if (str.length <= maxLength) {
      return str;
    }
    
    return str.substring(0, maxLength) + '...[TRUNCATED]';
  }

  /**
   * Create a structured error response
   * @param {Error} error - The error object
   * @returns {Object} Structured error response
   */
  createErrorResponse(error) {
    // Default error response
    let response = {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500
    };

    // Map specific errors to user-friendly messages
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      response = {
        error: 'Request timed out. The website may be slow or unavailable.',
        code: 'TIMEOUT',
        statusCode: 408
      };
    } else if (error.code === 'ENOTFOUND') {
      response = {
        error: 'Website not found. Please check the URL.',
        code: 'NOT_FOUND',
        statusCode: 404
      };
    } else if (error.code === 'ECONNREFUSED') {
      response = {
        error: 'Connection refused by the website.',
        code: 'CONNECTION_REFUSED',
        statusCode: 502
      };
    } else if (error.message.includes('CORS')) {
      response = {
        error: 'This website has security policies that prevent it from being replicated.',
        code: 'CORS_ERROR',
        statusCode: 403
      };
    }

    // Add debug info in development
    if (this.isDevelopment) {
      response.debug = {
        message: error.message,
        stack: error.stack
      };
    }

    return response;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();