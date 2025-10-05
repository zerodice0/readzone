import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UploadService {
  private readonly storageRoot: string;
  private readonly uploadDirectory: string;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const configuredRoot = this.configService.get<string>('FILE_STORAGE_ROOT');
    this.storageRoot = configuredRoot
      ? path.resolve(configuredRoot)
      : path.resolve(process.cwd(), 'packages/backend/storage');

    this.uploadDirectory = path.join(this.storageRoot, 'uploads', 'images');

    const configuredPublicUrl =
      this.configService.get<string>('BACKEND_PUBLIC_URL');
    const defaultPort = this.configService.get<string>('PORT') ?? '3001';
    this.publicBaseUrl = (
      configuredPublicUrl ?? `http://localhost:${defaultPort}`
    ).replace(/\/$/, '');
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      if (!file) throw new BadRequestException('파일이 필요합니다.');
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('이미지 크기는 5MB 이하여야 합니다.');
      }

      await fs.mkdir(this.uploadDirectory, { recursive: true });

      const fileName = this.createFileName(file.originalname);
      const destination = path.join(this.uploadDirectory, fileName);

      const output = await sharp(file.buffer)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('webp', { quality: 85 })
        .toFile(destination);

      const relativePath = path
        .join('uploads', 'images', fileName)
        .replace(/\\/g, '/');

      return {
        success: true,
        data: {
          url: this.buildPublicUrl(relativePath),
          publicPath: relativePath,
          width: output.width ?? null,
          height: output.height ?? null,
          format: 'webp',
        },
      };
    } catch (error) {
      console.error('Image upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        '이미지 업로드 중 오류가 발생했습니다.',
      );
    }
  }

  private createFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const baseName =
      originalName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 40) || 'image';

    return `${baseName}_${timestamp}_${randomSuffix}.webp`;
  }

  private buildPublicUrl(relativePath: string): string {
    const sanitized = relativePath.replace(/^\/+/, '');

    return `${this.publicBaseUrl}/${sanitized}`;
  }

  /**
   * 고아 파일 정리 스케줄러
   * 매주 일요일 새벽 3시 실행
   */
  @Cron('0 3 * * 0')
  async cleanupOrphanFiles() {
    try {
      console.log('[Cleanup] 고아 파일 정리 시작...');

      // 1. 디스크의 모든 이미지 파일 목록 가져오기
      const avatarsDir = path.join(this.storageRoot, 'uploads', 'avatars');

      const avatarFiles = await fs.readdir(avatarsDir);

      // 2. DB에서 사용 중인 이미지 URL 가져오기
      const users = await this.prisma.user.findMany({
        select: { profileImage: true },
      });

      // 3. 사용 중인 파일명 추출
      const usedFiles = new Set<string>();

      for (const user of users) {
        if (user.profileImage) {
          const fileName = path.basename(user.profileImage);
          usedFiles.add(fileName);
        }
      }

      // 4. 1주일 이상 된 고아 파일 삭제
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of avatarFiles) {
        if (!usedFiles.has(file)) {
          const filePath = path.join(avatarsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtimeMs < oneWeekAgo) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`[Cleanup] 삭제: ${file}`);
          }
        }
      }

      console.log(`[Cleanup] 완료: ${deletedCount}개 파일 삭제`);

      return { deletedCount };
    } catch (error) {
      console.error('[Cleanup] 에러:', error);
      throw error;
    }
  }
}
