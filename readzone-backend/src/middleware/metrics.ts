import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'readzone-backend'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});

const databaseQueriesTotal = new promClient.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status']
});

const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status']
});

const apiRateLimitHits = new promClient.Counter({
  name: 'api_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'ip']
});

const errorRate = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint', 'status_code']
});

const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const cpuUsage = new promClient.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(databaseQueriesTotal);
register.registerMetric(authenticationAttempts);
register.registerMetric(apiRateLimitHits);
register.registerMetric(errorRate);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);

// Middleware to track HTTP requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  activeConnections.inc();

  // Get route pattern for consistent labeling
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode.toString()
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
    activeConnections.dec();

    // Track errors
    if (res.statusCode >= 400) {
      errorRate.inc({
        type: res.statusCode >= 500 ? 'server_error' : 'client_error',
        endpoint: route,
        status_code: res.statusCode.toString()
      });
    }
  });

  next();
};

// Database metrics helpers
export const trackDatabaseQuery = async <T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration.observe({ operation, table }, duration);
    databaseQueriesTotal.inc({ operation, table, status: 'success' });
    
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration.observe({ operation, table }, duration);
    databaseQueriesTotal.inc({ operation, table, status: 'error' });
    
    throw error;
  }
};

// Authentication metrics
export const trackAuthenticationAttempt = (method: string, success: boolean) => {
  authenticationAttempts.inc({
    method,
    status: success ? 'success' : 'failure'
  });
};

// Rate limit metrics
export const trackRateLimitHit = (endpoint: string, ip: string) => {
  apiRateLimitHits.inc({ endpoint, ip });
};

// System metrics collection
export const updateSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  
  memoryUsage.set({ type: 'rss' }, memUsage.rss);
  memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
  memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
  memoryUsage.set({ type: 'external' }, memUsage.external);

  // CPU usage (simplified - in production, use more accurate measurement)
  const cpuUsagePercent = process.cpuUsage();
  const cpuPercent = (cpuUsagePercent.user + cpuUsagePercent.system) / 1000000; // Convert to seconds
  cpuUsage.set(cpuPercent);
};

// Start collecting system metrics every 10 seconds
setInterval(updateSystemMetrics, 10000);

// Export the register for the metrics endpoint
export { register };

// Business metrics
export const businessMetrics = {
  userRegistrations: new promClient.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['source']
  }),

  postsCreated: new promClient.Counter({
    name: 'posts_created_total',
    help: 'Total number of posts created',
    labelNames: ['type']
  }),

  booksSearched: new promClient.Counter({
    name: 'books_searched_total',
    help: 'Total number of book searches',
    labelNames: ['source']
  }),

  commentsCreated: new promClient.Counter({
    name: 'comments_created_total',
    help: 'Total number of comments created'
  }),

  likesGiven: new promClient.Counter({
    name: 'likes_given_total',
    help: 'Total number of likes given'
  }),

  userSessions: new promClient.Gauge({
    name: 'active_user_sessions',
    help: 'Number of active user sessions'
  }),

  pwaInstalls: new promClient.Counter({
    name: 'pwa_installs_total',
    help: 'Total number of PWA installations'
  }),

  pushNotificationsSent: new promClient.Counter({
    name: 'push_notifications_sent_total',
    help: 'Total number of push notifications sent',
    labelNames: ['type', 'status']
  })
};

// Register business metrics
Object.values(businessMetrics).forEach(metric => {
  register.registerMetric(metric);
});