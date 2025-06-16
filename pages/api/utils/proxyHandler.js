import { URL } from 'url';
import axios from 'axios';

class ProxyHandler {
  constructor() {
    this.axiosConfig = {
      timeout: 25000,
      maxRedirects: 5,
      validateStatus: status => status < 500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
  }

  /**
   * Create axios instance with custom configuration
   * @param {Object} additionalConfig - Additional axios configuration
   * @returns {Object} Axios instance
   */
  createAxiosInstance(additionalConfig = {}) {
    return axios.create({
      ...this.axiosConfig,
      ...additionalConfig
    });
  }

  /**
   * Validate if URL is safe to proxy
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validateUrl(url) {
    try {
      const parsedUrl = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          valid: false,
          error: 'Only HTTP and HTTPS protocols are supported'
        };
      }

      // Check for local/private addresses
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Localhost checks
      const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (localhostPatterns.includes(hostname)) {
        return {
          valid: false,
          error: 'Access to local addresses is not allowed'
        };
      }

      // Private IP range checks
      const privateIpRanges = [
        /^10\./,                     // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
        /^192\.168\./,               // 192.168.0.0/16
        /^169\.254\./,               // 169.254.0.0/16 (link-local)
        /^fc00:/,                    // IPv6 private
        /^fe80:/                     // IPv6 link-local
      ];

      for (const pattern of privateIpRanges) {
        if (pattern.test(hostname)) {
          return {
            valid: false,
            error: 'Access to private IP addresses is not allowed'
          };
        }
      }

      // Check for specific blocked domains (optional)
      const blockedDomains = process.env.BLOCKED_DOMAINS?.split(',') || [];
      if (blockedDomains.some(domain => hostname.includes(domain))) {
        return {
          valid: false,
          error: 'This domain has been blocked'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Handle binary content types
   * @param {string} contentType - Content-Type header value
   * @returns {boolean} True if binary content
   */
  isBinaryContent(contentType) {
    const binaryTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'application/zip',
      'application/octet-stream',
      'application/x-',
      'font/'
    ];

    return binaryTypes.some(type => contentType.includes(type));
  }

  /**
   * Rewrite URLs in CSS content
   * @param {string} css - CSS content
   * @param {string} baseUrl - Base URL for resolving relative paths
   * @returns {string} Modified CSS
   */
  rewriteCssUrls(css, baseUrl) {
    const urlPattern = /url\(['"]?([^'")]+)['"]?\)/g;
    
    return css.replace(urlPattern, (match, url) => {
      // Skip data URIs and absolute URLs
      if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return match;
      }

      // Convert relative to absolute
      try {
        const absoluteUrl = new URL(url, baseUrl).href;
        return `url('${absoluteUrl}')`;
      } catch (e) {
        return match;
      }
    });
  }

  /**
   * Rewrite URLs in JavaScript content (basic implementation)
   * @param {string} js - JavaScript content
   * @param {string} baseUrl - Base URL for resolving relative paths
   * @returns {string} Modified JavaScript
   */
  rewriteJavaScriptUrls(js, baseUrl) {
    // This is a basic implementation
    // In production, you'd want more sophisticated JS parsing
    
    // Rewrite fetch() calls
    js = js.replace(/fetch\(['"]([^'"]+)['"]\)/g, (match, url) => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        try {
          const absoluteUrl = new URL(url, baseUrl).href;
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          return `fetch('${proxyUrl}')`;
        } catch (e) {
          return match;
        }
      }
      return match;
    });

    // Rewrite XMLHttpRequest.open() calls
    js = js.replace(/\.open\(['"]([A-Z]+)['"],\s*['"]([^'"]+)['"]/g, (match, method, url) => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        try {
          const absoluteUrl = new URL(url, baseUrl).href;
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          return `.open('${method}', '${proxyUrl}'`;
        } catch (e) {
          return match;
        }
      }
      return match;
    });

    return js;
  }

  /**
   * Create a stream transformer for large responses
   * @param {Function} transform - Transform function
   * @returns {Object} Transform stream
   */
  createTransformStream(transform) {
    const { Transform } = require('stream');
    
    return new Transform({
      transform(chunk, encoding, callback) {
        try {
          const transformed = transform(chunk, encoding);
          callback(null, transformed);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  /**
   * Get mime type from file extension
   * @param {string} url - URL to check
   * @returns {string} MIME type
   */
  getMimeType(url) {
    const extension = url.split('.').pop()?.toLowerCase();
    
    const mimeTypes = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'webp': 'image/webp',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject',
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}

// Export singleton instance
export const proxyHandler = new ProxyHandler();