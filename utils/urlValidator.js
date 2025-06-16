import validator from 'validator';

/**
 * Validate URL with comprehensive checks
 * @param {string} url - URL to validate
 * @returns {Object} Validation result with isValid and error message
 */
export function validateUrl(url) {
  // Check if URL is provided
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Please enter a URL'
    };
  }

  // Trim whitespace
  url = url.trim();

  // Check if empty after trimming
  if (!url) {
    return {
      isValid: false,
      error: 'Please enter a URL'
    };
  }

  // Check URL length
  if (url.length > 2048) {
    return {
      isValid: false,
      error: 'URL is too long (maximum 2048 characters)'
    };
  }

  // Check if URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      isValid: false,
      error: 'URL must start with http:// or https://'
    };
  }

  // Use validator library for URL validation
  const validatorOptions = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    require_host: true,
    require_port: false,
    allow_protocol_relative_urls: false,
    allow_fragments: true,
    allow_query_components: true,
    validate_length: true
  };

  if (!validator.isURL(url, validatorOptions)) {
    return {
      isValid: false,
      error: 'Please enter a valid URL format'
    };
  }

  try {
    const parsedUrl = new URL(url);

    // Check for localhost and local IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    const localPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '[::1]'
    ];

    if (localPatterns.includes(hostname)) {
      return {
        isValid: false,
        error: 'Local addresses are not allowed for security reasons'
      };
    }

    // Check for private IP ranges
    if (isPrivateIP(hostname)) {
      return {
        isValid: false,
        error: 'Private IP addresses are not allowed for security reasons'
      };
    }

    // Check for invalid ports
    const port = parsedUrl.port;
    if (port) {
      const portNum = parseInt(port);
      if (portNum < 1 || portNum > 65535) {
        return {
          isValid: false,
          error: 'Invalid port number'
        };
      }

      // Block common internal service ports
      const blockedPorts = [22, 23, 25, 110, 135, 139, 445, 3389];
      if (blockedPorts.includes(portNum)) {
        return {
          isValid: false,
          error: 'This port is not allowed for security reasons'
        };
      }
    }

    // Check for suspicious patterns
    if (containsSuspiciousPatterns(url)) {
      return {
        isValid: false,
        error: 'URL contains suspicious patterns'
      };
    }

    // All checks passed
    return {
      isValid: true,
      error: null
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Check if hostname is a private IP address
 * @param {string} hostname - Hostname to check
 * @returns {boolean} True if private IP
 */
function isPrivateIP(hostname) {
  // IPv4 private ranges
  const ipv4Patterns = [
    /^10\./,                          // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,                    // 192.168.0.0/16
    /^169\.254\./                     // 169.254.0.0/16 (link-local)
  ];

  // IPv6 private ranges
  const ipv6Patterns = [
    /^fc00:/i,   // Unique local addresses
    /^fd[0-9a-f]{2}:/i,
    /^fe80:/i,   // Link-local addresses
    /^::1$/i,    // Loopback
    /^::/i       // Unspecified address
  ];

  // Check IPv4 patterns
  for (const pattern of ipv4Patterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  // Check IPv6 patterns (with or without brackets)
  const cleanHostname = hostname.replace(/^\[|\]$/g, '');
  for (const pattern of ipv6Patterns) {
    if (pattern.test(cleanHostname)) {
      return true;
    }
  }

  return false;
}

/**
 * Check for suspicious patterns in URL
 * @param {string} url - URL to check
 * @returns {boolean} True if suspicious
 */
function containsSuspiciousPatterns(url) {
  const suspiciousPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onmouseover=/i,
    /onclick=/i,
    /<script/i,
    /base64,/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(url));
}

/**
 * Sanitize URL for display
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export function sanitizeUrlForDisplay(url) {
  if (!url) return '';
  
  // Remove any potential XSS attempts
  return url
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Extract domain from URL
 * @param {string} url - URL to parse
 * @returns {string} Domain name
 */
export function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    return '';
  }
}