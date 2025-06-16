import { validateUrl, sanitizeUrlForDisplay, extractDomain } from '../../utils/urlValidator';

describe('URL Validator', () => {
  describe('validateUrl', () => {
    test('validates correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://subdomain.example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com:8080'
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBe(null);
      });
    });

    test('rejects invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'example.com',
        'ftp://example.com',
        'javascript:alert(1)',
        'https://localhost',
        'https://127.0.0.1',
        'https://192.168.1.1',
        'https://10.0.0.1'
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    test('rejects URLs without protocol', () => {
      const result = validateUrl('example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('http://');
    });

    test('rejects local addresses', () => {
      const localAddresses = [
        'http://localhost',
        'https://127.0.0.1',
        'http://[::1]',
        'https://0.0.0.0'
      ];

      localAddresses.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Local addresses');
      });
    });

    test('rejects private IP ranges', () => {
      const privateIPs = [
        'http://10.0.0.1',
        'https://172.16.0.1',
        'http://192.168.1.1',
        'https://169.254.1.1'
      ];

      privateIPs.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Private IP');
      });
    });

    test('rejects URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2100);
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('rejects suspicious patterns', () => {
      const suspiciousUrls = [
        'https://example.com?test=<script>alert(1)</script>',
        'javascript:void(0)',
        'data:text/html,<script>alert(1)</script>'
      ];

      suspiciousUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('sanitizeUrlForDisplay', () => {
    test('removes XSS attempts', () => {
      const maliciousUrl = 'https://example.com/<script>alert(1)</script>';
      const sanitized = sanitizeUrlForDisplay(maliciousUrl);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    test('removes javascript: protocol', () => {
      const maliciousUrl = 'javascript:alert(1)';
      const sanitized = sanitizeUrlForDisplay(maliciousUrl);
      expect(sanitized).not.toContain('javascript:');
    });

    test('handles empty input', () => {
      expect(sanitizeUrlForDisplay('')).toBe('');
      expect(sanitizeUrlForDisplay(null)).toBe('');
      expect(sanitizeUrlForDisplay(undefined)).toBe('');
    });
  });

  describe('extractDomain', () => {
    test('extracts domain from valid URLs', () => {
      expect(extractDomain('https://example.com')).toBe('example.com');
      expect(extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com');
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('https://example.com:8080')).toBe('example.com');
    });

    test('returns empty string for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('');
      expect(extractDomain('')).toBe('');
    });
  });
});