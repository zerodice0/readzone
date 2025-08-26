"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const prismaService = app.get(prisma_service_1.PrismaService);
    prismaService.enableShutdownHooks(app);
    const port = process.env.PORT || 3001;
    console.log('🚀 ReadZone NestJS API Server starting...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server will run on http://localhost:${port}`);
    await app.listen(port);
    console.log(`✅ ReadZone NestJS API Server is running on http://localhost:${port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map