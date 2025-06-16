# Vercel Deployment Guide

This guide provides detailed instructions for deploying the Website Replicator to Vercel.

## Pre-Deployment Checklist

- [ ] All dependencies are listed in `package.json` (including `openai`)
- [ ] `vercel.json` configuration is present
- [ ] `widget.js` is in the `public` directory
- [ ] OpenAI API key is obtained and ready to configure
- [ ] Environment variables are documented
- [ ] All tests pass locally
- [ ] No hardcoded sensitive information
- [ ] AI features tested locally

## Deployment Methods

### Method 1: Vercel CLI (Recommended for First Time)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Run deployment**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No (for first deployment)
   - Project name: `website-replicator` (or your choice)
   - Directory: `./` (current directory)
   - Override settings: No

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Method 2: Git Integration

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: (use default)
     - Output Directory: (use default)

3. **Configure Environment Variables**
   - Click "Environment Variables"
   - Add each variable:
     ```
     NODE_ENV = production
     OPENAI_API_KEY = your_openai_api_key_here
     RATE_LIMIT_REQUESTS = 100
     CHAT_RATE_LIMIT = 20
     IMAGE_RATE_LIMIT = 5
     MAX_REQUEST_SIZE = 52428800
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

## Environment Variables Configuration

### Required Variables

```bash
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key_here
RATE_LIMIT_REQUESTS=100
CHAT_RATE_LIMIT=20
IMAGE_RATE_LIMIT=5
MAX_REQUEST_SIZE=52428800
```

### Optional Variables

```bash
# Block specific domains
BLOCKED_DOMAINS=example.com,another-site.com

# Monitoring (if using Sentry)
SENTRY_DSN=your-sentry-dsn

# Analytics
ANALYTICS_ID=your-analytics-id
```

### Setting Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate values
3. Select which environments to apply to:
   - Production
   - Preview
   - Development

## Custom Domain Setup

1. **Add Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Automatically provisioned by Vercel
   - No additional configuration needed

## Monitoring Setup

### Vercel Analytics

1. Enable in Project Settings → Analytics
2. No code changes required
3. View metrics in Vercel dashboard

### Error Monitoring

1. **Set up Sentry** (optional)
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure Sentry**
   - Add SENTRY_DSN to environment variables
   - Initialize in `_app.js`

### Logs

- Access logs: Project → Functions → Logs
- Real-time logs: `vercel logs`
- Filter by function: `vercel logs --filter proxy`

## Performance Optimization

### Edge Functions

Consider converting to Edge Functions for better performance:

```javascript
// api/proxy.js
export const config = {
  runtime: 'edge',
};
```

### Caching

Add caching headers in `next.config.js`:

```javascript
{
  async headers() {
    return [
      {
        source: '/widget.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  }
}
```

## Troubleshooting Deployment

### Build Failures

1. **Check build logs**
   ```bash
   vercel logs
   ```

2. **Common issues:**
   - Missing dependencies: Check `package.json`
   - Build timeout: Optimize build process
   - Memory issues: Check function size

### Runtime Errors

1. **Function timeout**
   - Current limit: 30 seconds
   - Consider streaming responses
   - Implement request queuing

2. **Memory limit**
   - Current limit: 3008 MB
   - Monitor memory usage
   - Implement response streaming

### Environment Issues

1. **Variables not loading**
   - Verify in Project Settings
   - Redeploy after changes
   - Check variable names match code

## Security Hardening

### Headers

Already configured in `next.config.js`:
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy

### API Protection

Consider adding:
- API rate limiting
- Request validation
- IP allowlisting (Enterprise)

## Scaling Considerations

### Auto-scaling

Vercel automatically scales:
- No configuration needed
- Handles traffic spikes
- Global CDN distribution

### Limits

Be aware of:
- Bandwidth limits (100 GB/month free)
- Function executions (100k/month free)
- Build minutes (6000/month free)

### Monitoring Usage

1. Check usage: Project → Usage
2. Set up billing alerts
3. Optimize for efficiency

## Rollback Procedure

### Via Dashboard

1. Go to Project → Deployments
2. Find previous stable deployment
3. Click ⋮ → Promote to Production

### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Post-Deployment Tasks

1. **Test production URL**
   - Test with various websites
   - Check widget.js injection
   - Verify error handling

2. **Monitor performance**
   - Check response times
   - Monitor error rates
   - Track usage metrics

3. **Set up alerts**
   - Error rate threshold
   - Performance degradation
   - Usage limits

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Support: [vercel.com/support](https://vercel.com/support)
- Status: [vercel-status.com](https://www.vercel-status.com)