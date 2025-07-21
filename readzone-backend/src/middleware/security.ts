import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { trackRateLimitHit } from './metrics';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting configurations
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      trackRateLimitHit(req.route?.path || req.path, clientIp);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message
        }
      });
    }
  });
};

// Different rate limits for different endpoints
export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

export const strictRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 requests per windowMs
  'Too many requests for this endpoint, please try again later.'
);

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'API_KEY_REQUIRED',
        message: 'API key is required'
      }
    });
  }

  // Validate API key (implement your own logic)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key'
      }
    });
  }

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With']
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id || null
    };

    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Security Alert:', JSON.stringify(logData));
    }

    // Log slow requests
    if (duration > 5000) {
      console.warn('Slow Request:', JSON.stringify(logData));
    }
  });

  next();
};

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\'|(\'\')|(\'\+)|(\s+OR\s+)|(\s+AND\s+))/gi,
    /((EXEC|EXECUTE)\s+(sp_|xp_))/gi,
    /((\s+OR\s+)(\w+)(\s*)(\=)(\s*)(\w+))/gi
  ];

  const checkForSqlInjection = (value: string): boolean => {
    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkForSqlInjection(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    
    return false;
  };

  // Check query parameters
  if (req.query && checkObject(req.query)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid characters detected in query parameters'
      }
    });
  }

  // Check request body
  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid characters detected in request body'
      }
    });
  }

  next();
};

// File upload security
export const fileUploadSecurity = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  },
  fileFilter: (_req: Request, file: any, cb: any) => {
    // Allowed file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: 'Password is too common' };
  }

  return { isValid: true };
};

// Environment-specific security settings
export const environmentSecurity = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production-specific security measures
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    
    // Hide sensitive headers in production
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      hidePoweredBy: true
    });
  }

  return helmet({
    contentSecurityPolicy: false, // Disabled for development
    hsts: false // Disabled for development
  });
};