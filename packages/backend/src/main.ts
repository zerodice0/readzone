import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
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
