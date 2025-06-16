# API Documentation

## Base URL

```
https://your-domain.vercel.app/api
```

## Endpoints

### 1. Proxy Endpoint

Replicates a website and injects custom JavaScript.

**Endpoint:** `GET /api/proxy`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The complete URL to replicate (must include http:// or https://) |
| test | boolean | No | If true, only tests if URL is reachable without fetching content |

**Headers:**

Standard HTTP headers are forwarded appropriately.

**Response:**

- **Success (200):** Returns the modified HTML with injected widget.js
- **Success (200) - Test mode:** Returns `{ success: true }`
- **Bad Request (400):** Invalid URL format or missing parameter
- **Forbidden (403):** Access to local/private addresses blocked
- **Not Found (404):** Target website not found
- **Request Timeout (408):** Request timed out
- **Too Many Requests (429):** Rate limit exceeded
- **Server Error (500):** Internal server error

**Example Request:**

```bash
curl "https://your-domain.vercel.app/api/proxy?url=https://example.com"
```

**Example Test Request:**

```bash
curl "https://your-domain.vercel.app/api/proxy?url=https://example.com&test=true"
```

**Error Response Format:**

```json
{
  "error": "Error message",
  "statusCode": 400,
  "details": "Additional information (development mode only)"
}
```

### 2. Chat Completion Endpoint

Handles OpenAI GPT chat completions for AI conversations.

**Endpoint:** `POST /api/chat`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messages | array | Yes | Array of message objects with role and content |
| model | string | No | GPT model to use (default: gpt-3.5-turbo) |
| temperature | number | No | Response creativity 0-1 (default: 0.7) |
| max_tokens | number | No | Maximum response length (default: 1000) |

**Example Request:**

```json
{
  "messages": [
    {"role": "user", "content": "What is this website about?"}
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**

```json
{
  "success": true,
  "response": "This website appears to be...",
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 25,
    "total_tokens": 35
  }
}
```

**Rate Limiting:** 20 requests per minute per IP

### 3. Image Generation Endpoint

Handles OpenAI DALL-E image generation.

**Endpoint:** `POST /api/image`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | Description of image to generate |
| size | string | No | Image dimensions (default: 1024x1024) |
| quality | string | No | Image quality: standard/hd (default: standard) |
| style | string | No | Image style: vivid/natural (default: vivid) |

**Valid Sizes:**
- 256x256
- 512x512
- 1024x1024
- 1792x1024
- 1024x1792

**Example Request:**

```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid"
}
```

**Response:**

```json
{
  "success": true,
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid",
  "model": "dall-e-3"
}
```

**Rate Limiting:** 5 requests per minute per IP

### 4. Health Check Endpoint

Returns the health status of the service.

**Endpoint:** `GET /api/health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-06-16T10:30:00.000Z",
  "service": "website-replicator",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 12345.67,
  "memory": {
    "rss": 123456789,
    "heapTotal": 123456789,
    "heapUsed": 123456789,
    "external": 123456789
  },
  "checks": {
    "proxy": "operational",
    "rateLimit": "operational"
  }
}
```

## Rate Limiting

Different endpoints have different rate limits:

- **Proxy Endpoint:** 100 requests per minute per IP address
- **Chat Endpoint:** 20 requests per minute per IP address
- **Image Endpoint:** 5 requests per minute per IP address
- **Health Endpoint:** No rate limiting

**Headers Returned:**
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

**Rate Limit Exceeded Response:**

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

## Security

### Blocked Resources

The following are blocked for security:

1. **Local Addresses:**
   - localhost
   - 127.0.0.1
   - 0.0.0.0
   - ::1

2. **Private IP Ranges:**
   - 10.0.0.0/8
   - 172.16.0.0/12
   - 192.168.0.0/16
   - 169.254.0.0/16

3. **Protocols:**
   - Only HTTP and HTTPS are allowed
   - No FTP, file://, javascript:, data:, etc.

### Headers Removed

For security, the following headers are removed from proxied responses:

- X-Frame-Options
- Content-Security-Policy
- Strict-Transport-Security
- Public-Key-Pins
- Cross-Origin-* headers

## Content Types

### Supported Content Types

- **HTML:** text/html, application/xhtml+xml
- **CSS:** text/css
- **JavaScript:** application/javascript, text/javascript
- **Images:** image/png, image/jpeg, image/gif, image/svg+xml, image/webp
- **Fonts:** font/woff, font/woff2, font/ttf
- **Other:** application/json, application/xml, text/plain

### Special Handling

- **HTML:** Modified to inject widget.js and fix relative URLs
- **CSS:** URL references are converted to absolute paths
- **Binary Content:** Passed through without modification

## Error Codes

| Code | Type | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Invalid input provided |
| NETWORK_ERROR | 502 | Network connection failed |
| TIMEOUT_ERROR | 408 | Request timed out |
| SECURITY_ERROR | 403 | Security policy violation |
| NOT_FOUND_ERROR | 404 | Resource not found |
| RATE_LIMIT_ERROR | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

## Widget.js Injection

The `widget.js` file is automatically injected into all HTML responses:

1. **Injection Point:** Before the closing `</body>` tag
2. **Fallback:** If no body tag, injected at end of document
3. **Script Tag:** `<script src="/widget.js" data-injected="true"></script>`

## URL Rewriting

All relative URLs in the proxied content are converted to absolute URLs:

- **HTML attributes:** href, src, action, etc.
- **CSS url() functions**
- **JavaScript fetch() and XHR calls** (basic support)

## Limitations

1. **Response Size:** Maximum 50MB
2. **Timeout:** 30 seconds per request
3. **Redirects:** Maximum 5 redirects followed
4. **JavaScript:** Limited rewriting of dynamic URLs
5. **Authentication:** No support for authenticated pages
6. **Forms:** Limited form submission support

## Examples

### Basic Usage

```javascript
// Fetch and display a website
const response = await fetch('/api/proxy?url=https://example.com');
const html = await response.text();
document.getElementById('display').innerHTML = html;
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/proxy?url=https://example.com');
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Proxy error:', error);
    return;
  }
  
  const html = await response.text();
  // Use the HTML
} catch (error) {
  console.error('Network error:', error);
}
```

### Testing URL Validity

```javascript
// Test if URL is reachable before displaying
const testResponse = await fetch('/api/proxy?url=https://example.com&test=true');
const result = await testResponse.json();

if (result.success) {
  // URL is valid, proceed with full request
  const fullResponse = await fetch('/api/proxy?url=https://example.com');
  // ...
}
```