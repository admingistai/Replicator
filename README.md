# Website Replicator - JavaScript Injection Tool

A production-ready web application that replicates any website and automatically injects custom JavaScript (widget.js). Built with Next.js and deployable on Vercel.

## Features

- 🌐 **1:1 Website Replication**: Mirrors any website with complete fidelity
- 💉 **Automatic JavaScript Injection**: Injects your custom widget.js into every replicated page
- 🤖 **AI-Powered Widget**: OpenAI GPT integration for chat and image generation
- 🎨 **DALL-E Integration**: Generate images directly within replicated websites
- 🚀 **Serverless Architecture**: Optimized for Vercel deployment
- 🛡️ **Security First**: Comprehensive security measures and input validation
- ⚡ **Performance Optimized**: Streaming responses and efficient processing
- 📱 **Responsive Design**: Works on all devices
- 🔍 **Error Handling**: Comprehensive error handling with user-friendly messages

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Vercel account (for deployment)
- OpenAI API key (for AI features)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd website-replicator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file for local development:
```env
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
RATE_LIMIT_REQUESTS=100
CHAT_RATE_LIMIT=20
IMAGE_RATE_LIMIT=5
MAX_REQUEST_SIZE=52428800
```

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── pages/
│   ├── index.js                 # Main page with URL input
│   ├── _app.js                  # Next.js app wrapper
│   └── api/
│       ├── proxy.js             # Main proxy endpoint
│       ├── chat.js              # OpenAI chat completion endpoint
│       ├── image.js             # OpenAI image generation endpoint
│       └── health.js            # Health check endpoint
├── components/
│   ├── URLInputForm.jsx         # URL input component
│   ├── WebsiteDisplay.jsx       # Website display component
│   └── ErrorDisplay.jsx         # Error display component
├── api/utils/
│   ├── proxyHandler.js          # Core proxy logic
│   ├── htmlModifier.js          # HTML modification utilities
│   ├── headerProcessor.js       # HTTP header processing
│   └── errorLogger.js           # Error logging utilities
├── utils/
│   ├── urlValidator.js          # URL validation
│   └── errorHandler.js          # Error handling utilities
├── public/
│   └── widget.js                # Injectable JavaScript
├── styles/
│   └── globals.css              # Global styles
├── package.json
├── vercel.json                  # Vercel configuration
└── README.md
```

## Configuration

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `OPENAI_API_KEY` - Your OpenAI API key (required for AI features)
- `RATE_LIMIT_REQUESTS` - Max requests per minute per IP (default: 100)
- `CHAT_RATE_LIMIT` - Max AI chat requests per minute per IP (default: 20)
- `IMAGE_RATE_LIMIT` - Max AI image requests per minute per IP (default: 5)
- `MAX_REQUEST_SIZE` - Maximum request size in bytes (default: 50MB)
- `BLOCKED_DOMAINS` - Comma-separated list of blocked domains (optional)

### Customizing widget.js

Edit `/public/widget.js` to add your custom functionality. The widget is automatically injected into all replicated websites.

Built-in AI features:
- **Ask tool**: Chat with OpenAI GPT models
- **Gist tool**: Generate website summaries
- **Remix tool**: Create content variations with AI
- **Image generation**: Create images with DALL-E

Example customizations:
- Analytics tracking
- UI modifications
- Custom event handlers
- Content watermarking
- AI prompt customization

## Deployment to Vercel

### Method 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `CHAT_RATE_LIMIT` - AI chat rate limit (default: 20)
   - `IMAGE_RATE_LIMIT` - AI image rate limit (default: 5)
4. Deploy automatically on push

### Post-Deployment

1. Verify deployment at your Vercel URL
2. Test with various websites
3. Monitor logs in Vercel dashboard
4. Set up alerts for errors

## Usage

1. Navigate to your deployed application
2. Enter a complete URL (including http:// or https://)
3. Click "Replicate Website"
4. The website will be displayed with your widget.js injected

## Security Considerations

- Blocks access to localhost and private IP ranges
- Implements rate limiting
- Strips sensitive headers
- Validates all user inputs
- Prevents XSS attacks
- Removes CSP and X-Frame-Options headers

## Limitations

- Form submissions have limited functionality
- Some websites may block proxy access
- JavaScript-heavy SPAs may have navigation issues
- Authentication-required pages won't work
- Maximum response size: 50MB
- Request timeout: 30 seconds

## Testing

Run tests:
```bash
npm test
# or
yarn test
```

Test coverage:
```bash
npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **"URL is not reachable"**
   - Check if the website is accessible
   - Verify URL format includes protocol
   - Some websites block automated requests

2. **"Request timed out"**
   - Website may be slow
   - Try a simpler page from the same domain
   - Check your internet connection

3. **"Security policy violation"**
   - Website has strict CORS/CSP policies
   - Use "Open in New Tab" option
   - Some sites cannot be embedded

### Debug Mode

Enable debug mode in widget.js:
```javascript
const config = {
  debug: true
};
```

## API Reference

### GET /api/proxy

Proxy endpoint for website replication.

Query Parameters:
- `url` (required) - Target website URL
- `test` (optional) - Test mode flag

### POST /api/chat

OpenAI chat completion endpoint for AI conversations.

Request Body:
- `messages` (required) - Array of conversation messages
- `model` (optional) - GPT model to use (default: gpt-3.5-turbo)
- `temperature` (optional) - Response creativity (default: 0.7)
- `max_tokens` (optional) - Response length limit (default: 1000)

### POST /api/image

OpenAI DALL-E image generation endpoint.

Request Body:
- `prompt` (required) - Image description
- `size` (optional) - Image dimensions (default: 1024x1024)
- `quality` (optional) - Image quality (default: standard)
- `style` (optional) - Image style (default: vivid)

### GET /api/health

Health check endpoint returning service status.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Legal & Compliance

⚠️ **Important**: This tool is for educational and testing purposes only.

- Always obtain permission before replicating websites
- Respect copyright and intellectual property rights
- Follow websites' terms of service
- Consider robots.txt files
- Be aware of legal implications in your jurisdiction

## Performance Optimization

- Streams large responses instead of buffering
- Implements request deduplication
- Uses compression for text content
- Lazy loads non-critical resources
- Caches processed responses (configurable)

## Monitoring

Recommended monitoring setup:
- Vercel Analytics for performance
- Error tracking service (Sentry)
- Uptime monitoring
- Cost monitoring for Vercel usage

## License

[Your License Here]

## Support

For issues and questions:
- Create an issue in the repository
- Check existing issues for solutions
- Review the troubleshooting guide

## Changelog

### Version 1.0.0
- Initial release
- Core proxy functionality
- JavaScript injection
- Comprehensive error handling
- Vercel deployment ready