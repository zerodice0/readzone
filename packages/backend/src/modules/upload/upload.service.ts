import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return;
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured',
      );
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    this.configured = true;
  }

  async uploadImage(file: Express.Multer.File) {
    this.ensureConfigured();

    if (!file) throw new BadRequestException('File is required');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image size must be <= 5MB');
    }

    const result = await new Promise<import('cloudinary').UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'readzone/reviews',
            resource_type: 'image',
            overwrite: false,
          },
          (error, res) => {
            if (error || !res) {
              const errorToReject =
                error instanceof Error
                  ? error
                  : new Error(error?.message ?? 'Cloudinary upload failed');
              return reject(errorToReject);
            }
            resolve(res);
          },
        );
        stream.end(file.buffer);
      },
    );

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    };
  }
}
