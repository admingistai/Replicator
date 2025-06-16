class HeaderProcessor {
  constructor() {
    // Headers to remove from the response
    this.headersToRemove = [
      'x-frame-options',
      'content-security-policy',
      'content-security-policy-report-only',
      'x-content-security-policy',
      'x-webkit-csp',
      'strict-transport-security',
      'public-key-pins',
      'public-key-pins-report-only',
      'x-xss-protection',
      'x-content-type-options',
      'referrer-policy',
      'feature-policy',
      'permissions-policy',
      'cross-origin-embedder-policy',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'x-permitted-cross-domain-policies'
    ];

    // Headers to preserve
    this.headersToPreserve = [
      'content-type',
      'content-length',
      'content-encoding',
      'cache-control',
      'expires',
      'last-modified',
      'etag',
      'content-language',
      'content-disposition'
    ];

    // Headers to modify
    this.headersToModify = {
      'set-cookie': this.processCookies.bind(this),
      'location': this.processLocation.bind(this)
    };
  }

  /**
   * Process response headers from the target website
   * @param {Object} headers - Original response headers
   * @returns {Object} Processed headers
   */
  processResponseHeaders(headers) {
    const processedHeaders = {};

    // Process each header
    Object.entries(headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();

      // Skip headers that should be removed
      if (this.headersToRemove.includes(lowerKey)) {
        return;
      }

      // Apply modifications if needed
      if (this.headersToModify[lowerKey]) {
        const modifiedValue = this.headersToModify[lowerKey](value);
        if (modifiedValue !== null) {
          processedHeaders[key] = modifiedValue;
        }
      } else if (this.headersToPreserve.includes(lowerKey)) {
        // Preserve important headers
        processedHeaders[key] = value;
      }
      // Other headers are not included by default
    });

    // Add custom headers
    processedHeaders['X-Proxied'] = 'true';
    processedHeaders['X-Robots-Tag'] = 'noindex, nofollow';

    // Ensure proper CORS headers for the proxy
    processedHeaders['Access-Control-Allow-Origin'] = '*';
    processedHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    processedHeaders['Access-Control-Allow-Headers'] = 'Content-Type';

    return processedHeaders;
  }

  /**
   * Process request headers to send to the target website
   * @param {Object} headers - Original request headers
   * @returns {Object} Processed headers
   */
  processRequestHeaders(headers) {
    const processedHeaders = {};

    // Headers to forward from the original request
    const headersToForward = [
      'accept',
      'accept-language',
      'accept-encoding',
      'cache-control',
      'pragma',
      'user-agent',
      'referer'
    ];

    headersToForward.forEach(header => {
      if (headers[header]) {
        processedHeaders[header] = headers[header];
      }
    });

    // Override or add specific headers
    processedHeaders['user-agent'] = headers['user-agent'] || 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    // Remove headers that might cause issues
    delete processedHeaders['host'];
    delete processedHeaders['connection'];
    delete processedHeaders['cookie']; // Don't forward cookies by default
    delete processedHeaders['authorization']; // Don't forward auth headers

    return processedHeaders;
  }

  /**
   * Process Set-Cookie headers
   * @param {string|string[]} cookies - Cookie header value(s)
   * @returns {string|string[]|null} Modified cookie value(s)
   */
  processCookies(cookies) {
    // For now, we'll strip cookies to avoid security issues
    // In a production system, you might want to handle these more carefully
    return null;
  }

  /**
   * Process Location header for redirects
   * @param {string} location - Location header value
   * @returns {string} Modified location value
   */
  processLocation(location) {
    // Convert redirect locations to go through the proxy
    if (location) {
      try {
        // If it's an absolute URL, encode it for the proxy
        if (location.startsWith('http://') || location.startsWith('https://')) {
          return `/api/proxy?url=${encodeURIComponent(location)}`;
        }
        // Relative redirects are handled by the browser
        return location;
      } catch (e) {
        return location;
      }
    }
    return location;
  }

  /**
   * Get content type from headers
   * @param {Object} headers - Response headers
   * @returns {string} Content type
   */
  getContentType(headers) {
    const contentType = headers['content-type'] || headers['Content-Type'] || 'text/html';
    return contentType.split(';')[0].trim().toLowerCase();
  }

  /**
   * Check if response should be processed as HTML
   * @param {Object} headers - Response headers
   * @returns {boolean} True if HTML
   */
  isHtmlResponse(headers) {
    const contentType = this.getContentType(headers);
    return contentType === 'text/html' || 
           contentType === 'application/xhtml+xml' ||
           contentType === 'text/xml';
  }
}

// Export singleton instance
export const headerProcessor = new HeaderProcessor();