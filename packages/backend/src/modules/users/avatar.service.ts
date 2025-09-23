import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { AvatarCropDto, UpdateAvatarResponse } from './dto/update-profile.dto';

@Injectable()
export class AvatarService {
  private configured = false;

  constructor(private configService: ConfigService) {}

  private ensureConfigured() {
    if (this.configured) return;

    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException('Cloudinary environment variables are not configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.configured = true;
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
    cropData?: AvatarCropDto
  ): Promise<UpdateAvatarResponse> {
    this.ensureConfigured();

    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('이미지 파일이 필요합니다.');
      }

      if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        throw new BadRequestException('JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
      }

      // Generate multiple sizes with cropping if provided
      const sizes = await this.generateMultipleSizes(file.buffer, cropData);

      // Upload all sizes to Cloudinary
      const uploadPromises = Object.entries(sizes).map(([sizeName, buffer]) =>
        this.uploadToCloudinary(buffer, `avatar_${userId}_${sizeName}`)
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Map results to size URLs
      const avatarUrls = {
        thumbnail: uploadResults[0].secure_url, // 50x50
        small: uploadResults[1].secure_url,     // 100x100
        medium: uploadResults[2].secure_url,    // 200x200
        large: uploadResults[3].secure_url,     // 400x400
      };

      return {
        success: true,
        profileImage: avatarUrls.medium, // 기본 프로필 이미지
        sizes: avatarUrls,
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('프로필 사진 업로드 중 오류가 발생했습니다.');
    }
  }

  private async generateMultipleSizes(
    buffer: Buffer,
    cropData?: AvatarCropDto
  ): Promise<{ [key: string]: Buffer }> {
    // For now, return the original buffer for all sizes
    // In a full implementation, you would use sharp library to process images
    const sizes = ['thumbnail', 'small', 'medium', 'large'];
    const results: { [key: string]: Buffer } = {};

    for (const size of sizes) {
      results[size] = buffer; // Placeholder - in real implementation use sharp
    }

    return results;
  }

  private async uploadToCloudinary(buffer: Buffer, publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'readzone/avatars',
          resource_type: 'image',
          format: 'jpg',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'center' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
  }
}