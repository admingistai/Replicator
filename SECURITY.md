# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email security details to: [your-security-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide updates on the fix.

## Security Measures

### Input Validation

- **URL Validation:** Comprehensive validation of all input URLs
- **Protocol Restrictions:** Only HTTP/HTTPS allowed
- **Length Limits:** Maximum URL length of 2048 characters
- **Pattern Matching:** Blocks suspicious patterns and XSS attempts
- **AI Input Validation:** Chat messages and image prompts are validated and sanitized
- **Content Policy Compliance:** OpenAI's content policies are enforced

### Network Security

- **IP Blocking:** Prevents access to local and private IP ranges
- **Port Restrictions:** Blocks common internal service ports
- **Rate Limiting:** Prevents abuse through request throttling
  - Proxy endpoints: 100 requests/minute per IP
  - AI chat endpoints: 20 requests/minute per IP
  - AI image endpoints: 5 requests/minute per IP
- **Timeout Protection:** 30-second maximum request duration
- **API Key Security:** OpenAI API key stored server-side only

### Content Security

- **Header Stripping:** Removes security headers that prevent embedding
- **Script Injection:** Controlled injection of widget.js only
- **XSS Prevention:** Input sanitization and output encoding
- **CSRF Protection:** Stateless API design

### Infrastructure Security

- **Serverless Architecture:** Reduced attack surface
- **Environment Isolation:** Vercel function sandboxing
- **No Data Storage:** No user data persistence
- **HTTPS Only:** Enforced SSL/TLS encryption

## Security Best Practices

### For Deployment

1. **Environment Variables**
   - Never commit sensitive data (especially OpenAI API keys)
   - Use Vercel's environment variable encryption
   - Rotate secrets regularly, including OpenAI API keys
   - Monitor OpenAI API usage and costs

2. **Access Control**
   - Implement IP allowlisting if needed
   - Use Vercel's authentication features
   - Monitor access logs

3. **Monitoring**
   - Set up error alerting
   - Monitor for suspicious patterns
   - Track rate limit violations

### For Users

1. **Legal Compliance**
   - Only replicate websites you have permission to access
   - Respect robots.txt and terms of service
   - Be aware of copyright implications

2. **Privacy**
   - Understand that replicated content passes through our proxy
   - No data is stored, but it is processed
   - Use HTTPS URLs whenever possible

3. **Widget.js Customization**
   - Review code before deploying
   - Avoid including sensitive logic
   - Test thoroughly in development

## Known Limitations

### By Design

These limitations exist for security reasons:

1. **No Authentication Support**
   - Cannot proxy authenticated pages
   - No cookie forwarding
   - No credential handling

2. **Form Restrictions**
   - Limited form submission support
   - No file upload capability
   - POST requests not fully supported

3. **JavaScript Limitations**
   - Basic URL rewriting only
   - Dynamic content may break
   - Some SPAs won't function correctly

### Accepted Risks

1. **Content Injection**
   - Sites can detect they're being proxied
   - Original site's JavaScript still executes
   - Potential for conflicts with widget.js

2. **Performance**
   - Additional latency from proxying
   - Large files may timeout
   - No caching implemented

## Security Headers

The application implements these security headers:

```
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
X-Robots-Tag: noindex, nofollow
```

## Compliance

### GDPR

- No personal data collection
- No cookies set
- No tracking implemented
- Logs contain minimal information

### CCPA

- No sale of personal information
- No data retention
- User rights not applicable (no data stored)

## Security Audit Checklist

Regular security reviews should verify:

- [ ] All dependencies are up to date
- [ ] No vulnerable packages (npm audit)
- [ ] Input validation is working correctly
- [ ] Rate limiting is effective
- [ ] Error messages don't leak sensitive info
- [ ] Headers are properly sanitized
- [ ] No debug code in production
- [ ] Environment variables are secure

## Third-Party Security

### Dependencies

We regularly update dependencies and monitor for vulnerabilities:

- Next.js: Core framework
- Axios: HTTP client
- Cheerio: HTML parsing
- Validator: Input validation

Run `npm audit` regularly to check for vulnerabilities.

### Vercel Platform

Security features provided by Vercel:

- DDoS protection
- Automatic HTTPS
- Isolated function execution
- Built-in firewall

## Incident Response

In case of a security incident:

1. **Immediate Actions**
   - Disable affected endpoints
   - Review logs for impact
   - Notify affected users if applicable

2. **Investigation**
   - Determine root cause
   - Assess data exposure
   - Document timeline

3. **Remediation**
   - Deploy fixes
   - Update security measures
   - Publish post-mortem if appropriate

## Contact

Security concerns: [your-security-email@example.com]
General support: [your-support-email@example.com]