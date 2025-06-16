/**
 * Rate limiting middleware for serverless functions
 * Uses in-memory storage (resets on cold starts)
 */

class RateLimiter {
  constructor(options = {}) {
    this.requests = new Map();
    this.options = {
      windowMs: options.windowMs || 60 * 1000, // 1 minute
      max: options.max || 100, // max requests per window
      message: options.message || 'Too many requests, please try again later.',
      statusCode: options.statusCode || 429,
      headers: options.headers !== false, // send rate limit headers
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || true,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      skip: options.skip || (() => false)
    };

    // Clean up old entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.options.windowMs);
  }

  /**
   * Default key generator (uses IP address)
   * @param {Object} req - Request object
   * @returns {string} Client identifier
   */
  defaultKeyGenerator(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           'unknown';
  }

  /**
   * Get or create client record
   * @param {string} key - Client key
   * @returns {Object} Client record
   */
  getClient(key) {
    const now = Date.now();
    let client = this.requests.get(key);

    if (!client) {
      client = {
        count: 0,
        resetTime: now + this.options.windowMs
      };
      this.requests.set(key, client);
    }

    // Reset if window has passed
    if (now > client.resetTime) {
      client.count = 0;
      client.resetTime = now + this.options.windowMs;
    }

    return client;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    this.requests.forEach((client, key) => {
      if (now > client.resetTime + this.options.windowMs) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.requests.delete(key));
  }

  /**
   * Check if request should be rate limited
   * @param {Object} req - Request object
   * @returns {Object} Rate limit status
   */
  check(req) {
    // Check if should skip
    if (this.options.skip(req)) {
      return { limited: false };
    }

    const key = this.options.keyGenerator(req);
    const client = this.getClient(key);
    
    // Increment counter
    client.count++;

    const remaining = Math.max(0, this.options.max - client.count);
    const retryAfter = Math.ceil((client.resetTime - Date.now()) / 1000);

    const result = {
      limited: client.count > this.options.max,
      remaining,
      total: this.options.max,
      retryAfter,
      resetTime: client.resetTime
    };

    return result;
  }

  /**
   * Express/Next.js middleware
   * @returns {Function} Middleware function
   */
  middleware() {
    return (req, res, next) => {
      const result = this.check(req);

      // Add rate limit headers if enabled
      if (this.options.headers) {
        res.setHeader('X-RateLimit-Limit', result.total);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        
        if (result.limited) {
          res.setHeader('Retry-After', result.retryAfter);
        }
      }

      // Check if limited
      if (result.limited) {
        res.status(this.options.statusCode).json({
          error: this.options.message,
          retryAfter: result.retryAfter
        });
        return;
      }

      // Continue to next middleware
      if (next) {
        next();
      }
    };
  }

  /**
   * Async middleware for Next.js API routes
   * @param {Function} handler - API route handler
   * @returns {Function} Wrapped handler
   */
  withRateLimit(handler) {
    return async (req, res) => {
      const result = this.check(req);

      // Add rate limit headers if enabled
      if (this.options.headers) {
        res.setHeader('X-RateLimit-Limit', result.total);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        
        if (result.limited) {
          res.setHeader('Retry-After', result.retryAfter);
        }
      }

      // Check if limited
      if (result.limited) {
        return res.status(this.options.statusCode).json({
          error: this.options.message,
          retryAfter: result.retryAfter
        });
      }

      // Call the handler
      return handler(req, res);
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Client key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.requests.clear();
  }

  /**
   * Get current status for a client
   * @param {string} key - Client key
   * @returns {Object} Client status
   */
  getStatus(key) {
    const client = this.requests.get(key);
    if (!client) {
      return {
        count: 0,
        remaining: this.options.max,
        resetTime: null
      };
    }

    return {
      count: client.count,
      remaining: Math.max(0, this.options.max - client.count),
      resetTime: new Date(client.resetTime).toISOString()
    };
  }

  /**
   * Destroy the rate limiter (cleanup)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

// Create instances for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
  message: 'Too many requests. Please try again later.',
  headers: true
});

export const strictRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Stricter limit
  message: 'Rate limit exceeded. Please wait before trying again.',
  headers: true
});

// Utility functions
export function createRateLimiter(options) {
  return new RateLimiter(options);
}

// IP-based rate limiting with different limits for different IPs
export function createTieredRateLimiter() {
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  
  return new RateLimiter({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => {
      const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
      return ip;
    },
    skip: (req) => {
      const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
      return trustedIPs.includes(ip);
    }
  });
}