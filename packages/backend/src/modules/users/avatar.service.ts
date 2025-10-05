import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';
import { UpdateAvatarResponse } from './dto/update-profile.dto';

interface AvatarVariantConfig {
  key: 'thumbnail' | 'small' | 'medium' | 'large';
  width: number;
  height: number;
  quality: number;
}

interface SavedAvatarVariant {
  key: AvatarVariantConfig['key'];
  publicUrl: string;
}

@Injectable()
export class AvatarService {
  private readonly storageRoot: string;
  private readonly avatarDirectory: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configuredRoot = this.configService.get<string>('FILE_STORAGE_ROOT');
    this.storageRoot = configuredRoot
      ? path.resolve(configuredRoot)
      : path.resolve(process.cwd(), 'packages/backend/storage');

    this.avatarDirectory = path.join(this.storageRoot, 'uploads', 'avatars');

    const configuredPublicUrl =
      this.configService.get<string>('BACKEND_PUBLIC_URL');
    const defaultPort = this.configService.get<string>('PORT') ?? '3001';
    this.publicBaseUrl = (
      configuredPublicUrl ?? `http://localhost:${defaultPort}`
    ).replace(/\/$/, '');
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UpdateAvatarResponse> {
    try {
      if (!file) {
        throw new BadRequestException('이미지 파일이 필요합니다.');
      }

      if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        throw new BadRequestException(
          'JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.',
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
      }

      await this.ensureStorageDirectory();

      const baseName = this.buildBaseFileName(userId);
      const savedVariants = await Promise.all(
        this.getVariantConfig().map((variant) =>
          this.generateVariant(file.buffer, baseName, variant),
        ),
      );

      const urls = savedVariants.reduce(
        (acc, variant) => {
          acc[variant.key] = variant.publicUrl;
          return acc;
        },
        {
          thumbnail: '',
          small: '',
          medium: '',
          large: '',
        } as { [key in AvatarVariantConfig['key']]: string },
      );

      return {
        success: true,
        profileImage: urls.medium,
        sizes: urls,
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        '프로필 사진 업로드 중 오류가 발생했습니다.',
      );
    }
  }

  private getVariantConfig(): AvatarVariantConfig[] {
    return [
      { key: 'thumbnail', width: 64, height: 64, quality: 80 },
      { key: 'small', width: 128, height: 128, quality: 82 },
      { key: 'medium', width: 256, height: 256, quality: 85 },
      { key: 'large', width: 512, height: 512, quality: 90 },
    ];
  }

  private buildBaseFileName(userId: string): string {
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
    const timestamp = Date.now();

    return `${sanitizedUserId}_${timestamp}`;
  }

  private async ensureStorageDirectory(): Promise<void> {
    await fs.mkdir(this.avatarDirectory, { recursive: true });
  }

  private async generateVariant(
    buffer: Buffer,
    baseName: string,
    variant: AvatarVariantConfig,
  ): Promise<SavedAvatarVariant> {
    const fileName = `${baseName}_${variant.key}.webp`;
    const destination = path.join(this.avatarDirectory, fileName);

    await sharp(buffer)
      .resize(variant.width, variant.height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat('webp', { quality: variant.quality })
      .toFile(destination);

    const relativePath = path
      .join('uploads', 'avatars', fileName)
      .replace(/\\/g, '/');

    return {
      key: variant.key,
      publicUrl: this.buildPublicUrl(relativePath),
    };
  }

  private buildPublicUrl(relativePath: string): string {
    const sanitized = relativePath.replace(/^\/+/, '');

    return `${this.publicBaseUrl}/${sanitized}`;
  }
}
