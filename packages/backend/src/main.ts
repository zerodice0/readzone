import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/utils/logger';

async function bootstrap() {
  const logger = new LoggerService('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: new LoggerService(),
      bufferLogs: true,
    });

    // Get configuration
    const port = parseInt(process.env.PORT || '3000', 10);
    const apiPrefix = process.env.API_PREFIX || '/api/v1';
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

    // Set global prefix for all routes
    app.setGlobalPrefix(apiPrefix);

    // Enable CORS with secure defaults
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
      maxAge: 86400, // 24 hours
    });

    // Enable Helmet for security headers
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        frameguard: {
          action: 'deny',
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin',
        },
      })
    );

    // Enable global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    // Enable shutdown hooks
    app.enableShutdownHooks();

    // Start the server
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Server is running on http://localhost:${port}${apiPrefix}`);
    logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🔒 CORS Origin: ${corsOrigin}`);
    logger.log(`💊 Health Check: http://localhost:${port}${apiPrefix}/health`);
  } catch (error) {
    logger.error(
      'Failed to start server',
      error instanceof Error ? error.stack : undefined
    );
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new LoggerService('Process');
  logger.fatal('Uncaught Exception', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  const logger = new LoggerService('Process');
  logger.fatal(
    'Unhandled Rejection',
    reason instanceof Error ? reason.stack : String(reason)
  );
  process.exit(1);
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  const logger = new LoggerService('Process');
  logger.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  const logger = new LoggerService('Process');
  logger.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

bootstrap().catch((err: unknown) => {
  const logger = new LoggerService('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
