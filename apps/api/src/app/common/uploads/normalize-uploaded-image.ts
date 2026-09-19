import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

const MAX_IMAGE_PIXELS = 16_000_000;
const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export const normalizeUploadedImage = async (
  buffer: Buffer,
  declaredMimeType: string,
) => {
  try {
    const image = sharp(buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: 'warning',
    });
    const metadata = await image.metadata();
    const format = metadata.format;
    if (
      (format !== 'jpeg' && format !== 'png' && format !== 'webp') ||
      MIME_BY_FORMAT[format] !== declaredMimeType ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
      (metadata.pages ?? 1) > 1
    ) {
      throw new Error('Unsupported image');
    }
    // Decode and re-encode: reject corrupt input and discard metadata/trailing payloads.
    return {
      buffer: await image.rotate().toFormat(format).toBuffer(),
      mimeType: MIME_BY_FORMAT[format],
    };
  } catch {
    throw new BadRequestException(
      'Upload a valid JPEG, PNG or WebP image of at most 16 megapixels',
    );
  }
};
