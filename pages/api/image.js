import OpenAI from 'openai';

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting (simple in-memory for serverless)
const requestCounts = new Map();
const RATE_LIMIT = parseInt(process.env.IMAGE_RATE_LIMIT || '5'); // Very low limit for image generation
const RATE_WINDOW = 60 * 1000; // 1 minute

export default async function handler(req, res) {
  // Set CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' 
      });
    }

    // Simple rate limiting (stricter for image generation)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const clientRequests = requestCounts.get(clientIP) || { count: 0, resetTime: now + RATE_WINDOW };

    if (now > clientRequests.resetTime) {
      clientRequests.count = 0;
      clientRequests.resetTime = now + RATE_WINDOW;
    }

    clientRequests.count++;
    requestCounts.set(clientIP, clientRequests);

    if (clientRequests.count > RATE_LIMIT) {
      return res.status(429).json({ 
        error: 'Too many image generation requests. Please try again later.',
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      });
    }

    // Extract request data
    const { 
      prompt, 
      size = '1024x1024', 
      quality = 'standard',
      style = 'vivid',
      n = 1 
    } = req.body;

    // Validate request
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt too long. Maximum 1000 characters.' });
    }

    // Validate size parameter
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return res.status(400).json({ error: 'Invalid size. Must be one of: ' + validSizes.join(', ') });
    }

    // Clean and enhance prompt for better results
    const cleanPrompt = prompt.trim();
    
    console.log(`[Image API] Generating image with prompt: "${cleanPrompt}"`);

    // Make OpenAI DALL-E API call
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3', // Use DALL-E 3 for better quality
      prompt: cleanPrompt,
      size: size,
      quality: quality,
      style: style,
      n: 1, // DALL-E 3 only supports n=1
      response_format: 'url'
    });

    // Extract image URL
    const imageUrl = imageResponse.data[0]?.url;
    
    if (!imageUrl) {
      return res.status(500).json({ error: 'No image generated' });
    }

    console.log(`[Image API] Successfully generated image: ${imageUrl}`);

    // Return successful response
    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      prompt: cleanPrompt,
      size: size,
      quality: quality,
      style: style,
      model: 'dall-e-3'
    });

  } catch (error) {
    console.error('Image API error:', error.message);

    // Handle OpenAI specific errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401) {
        return res.status(401).json({ error: 'Invalid OpenAI API key' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'OpenAI API rate limit exceeded. Please try again later.' });
      }
      if (status === 400) {
        const errorMessage = errorData?.error?.message || 'Invalid request to OpenAI API';
        
        // Handle content policy violations
        if (errorMessage.includes('content policy')) {
          return res.status(400).json({ 
            error: 'Image prompt violates content policy. Please try a different prompt.' 
          });
        }
        
        return res.status(400).json({ error: errorMessage });
      }
      if (status === 500) {
        return res.status(500).json({ error: 'OpenAI service temporarily unavailable' });
      }

      return res.status(status).json({ 
        error: errorData?.error?.message || 'OpenAI API error',
        details: process.env.NODE_ENV === 'development' ? errorData : undefined
      });
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(408).json({ error: 'Request timeout' });
    }

    // Generic error
    return res.status(500).json({ 
      error: 'An unexpected error occurred while generating image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Export config for Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: false
  }
}; 