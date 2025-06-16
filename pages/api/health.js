export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'website-replicator',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      proxy: 'operational',
      rateLimit: 'operational'
    }
  };

  res.status(200).json(health);
}