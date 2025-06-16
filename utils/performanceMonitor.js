/**
 * Performance monitoring utility
 * Tracks and reports performance metrics for the application
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
  }

  /**
   * Start a performance timer
   * @param {string} label - Timer label
   */
  startTimer(label) {
    this.timers.set(label, {
      start: Date.now(),
      marks: []
    });
  }

  /**
   * Mark a point in the timer
   * @param {string} label - Timer label
   * @param {string} mark - Mark name
   */
  mark(label, mark) {
    const timer = this.timers.get(label);
    if (timer) {
      timer.marks.push({
        name: mark,
        time: Date.now() - timer.start
      });
    }
  }

  /**
   * End a timer and record the metric
   * @param {string} label - Timer label
   * @returns {number} Duration in milliseconds
   */
  endTimer(label) {
    const timer = this.timers.get(label);
    if (!timer) return null;

    const duration = Date.now() - timer.start;
    
    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        avg: 0,
        marks: []
      });
    }

    const metric = this.metrics.get(label);
    metric.count++;
    metric.total += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
    metric.avg = metric.total / metric.count;
    metric.lastDuration = duration;
    metric.marks = timer.marks;

    this.timers.delete(label);
    return duration;
  }

  /**
   * Get metrics for a specific label
   * @param {string} label - Metric label
   * @returns {Object} Metric data
   */
  getMetric(label) {
    return this.metrics.get(label);
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    const result = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
  }

  /**
   * Track memory usage
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: this.formatBytes(usage.heapUsed),
        heapTotal: this.formatBytes(usage.heapTotal),
        rss: this.formatBytes(usage.rss),
        external: this.formatBytes(usage.external),
        heapUsedPercent: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2) + '%'
      };
    }
    return null;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Create a performance report
   * @returns {Object} Performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getAllMetrics(),
      memory: this.getMemoryUsage(),
      summary: {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0
      }
    };

    // Calculate summary
    const proxyMetric = this.getMetric('proxy_request');
    if (proxyMetric) {
      report.summary.totalRequests = proxyMetric.count;
      report.summary.averageResponseTime = Math.round(proxyMetric.avg);
    }

    return report;
  }

  /**
   * Log slow requests
   * @param {string} url - Request URL
   * @param {number} duration - Request duration
   * @param {number} threshold - Slow request threshold (ms)
   */
  logSlowRequest(url, duration, threshold = 5000) {
    if (duration > threshold) {
      console.warn(`Slow request detected: ${url} took ${duration}ms`);
      
      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Send to monitoring service
      }
    }
  }

  /**
   * Monitor function execution
   * @param {string} name - Function name
   * @param {Function} fn - Function to monitor
   * @returns {Function} Wrapped function
   */
  monitor(name, fn) {
    return async (...args) => {
      this.startTimer(name);
      try {
        const result = await fn(...args);
        const duration = this.endTimer(name);
        
        // Log slow operations
        if (duration > 1000) {
          console.warn(`Slow operation: ${name} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        this.endTimer(name);
        throw error;
      }
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware for Express/Next.js API routes
export function performanceMiddleware(handler) {
  return async (req, res) => {
    const label = `${req.method} ${req.url?.split('?')[0]}`;
    performanceMonitor.startTimer(label);

    // Override res.end to capture when response is sent
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = performanceMonitor.endTimer(label);
      
      // Add performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
      
      // Log slow requests
      performanceMonitor.logSlowRequest(req.url, duration);
      
      // Call original end
      originalEnd.apply(res, args);
    };

    // Continue with handler
    try {
      await handler(req, res);
    } catch (error) {
      performanceMonitor.endTimer(label);
      throw error;
    }
  };
}