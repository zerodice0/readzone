import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable cookie parser middleware
  app.use(cookieParser());

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS with enhanced settings for cookie-based auth
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' 
      ? (origin, callback) => {
          // 개발 환경에서는 localhost의 모든 포트 허용
          if (!origin || origin.includes('localhost')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable shutdown hooks for Prisma
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const port = process.env.PORT || 3001;
  console.log('🚀 ReadZone NestJS API Server starting...');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server will run on http://localhost:${port}`);

  await app.listen(port);
  console.log(
    `✅ ReadZone NestJS API Server is running on http://localhost:${port}`,
  );
}
void bootstrap();
