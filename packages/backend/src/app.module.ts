import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BooksModule } from './modules/books/books.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ContentModule } from './modules/content/content.module';
import { UploadModule } from './modules/upload/upload.module';
import { TagsModule } from './modules/tags/tags.module';
import { SearchModule } from './modules/search/search.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ModerationModule } from './modules/moderation/moderation.module';

const storageRoot = process.env.FILE_STORAGE_ROOT
  ? path.resolve(process.env.FILE_STORAGE_ROOT)
  : path.resolve(process.cwd(), 'packages/backend/storage');
const uploadsRoot = path.join(storageRoot, 'uploads');

if (!existsSync(uploadsRoot)) {
  mkdirSync(uploadsRoot, { recursive: true });
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    ServeStaticModule.forRoot({
      rootPath: uploadsRoot,
      serveRoot: '/uploads',
      serveStaticOptions: {
        maxAge: 31536000000, // 1년 (밀리초)
        immutable: true, // 파일이 절대 변경되지 않음
        etag: true, // ETag 헤더 활성화
        lastModified: true, // Last-Modified 헤더 활성화
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    BooksModule,
    ReviewsModule,
    ContentModule,
    UploadModule,
    TagsModule,
    SearchModule,
    SettingsModule,
    NotificationsModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
