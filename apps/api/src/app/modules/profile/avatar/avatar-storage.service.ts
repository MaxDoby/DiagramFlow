import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ensureAvatarUploadDirectory } from './avatar-upload-directory';
import { unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { createAvatarFileName } from './avatar-file-name';
import { normalizeUploadedImage } from '../../../common/uploads/normalize-uploaded-image';

@Injectable()
export class AvatarStorageService {
  private readonly avatarDirectory: string;

  constructor(configService: ConfigService) {
    this.avatarDirectory = ensureAvatarUploadDirectory(configService);
  }

  async save(file: Express.Multer.File): Promise<string> {
    const image = await normalizeUploadedImage(file.buffer, file.mimetype);
    const fileName = createAvatarFileName(image.mimeType);
    await writeFile(resolve(this.avatarDirectory, fileName), image.buffer, {
      flag: 'wx',
    });
    return fileName;
  }

  buildPublicUrl(fileName: string): string {
    return `/uploads/avatars/${fileName}`;
  }

  async deleteByPublicUrl(avatarUrl: string | null): Promise<void> {
    if (avatarUrl === null || !avatarUrl.startsWith('/uploads/avatars/')) {
      return;
    }

    const fileName = basename(avatarUrl);
    const filePath = resolve(this.avatarDirectory, fileName);

    try {
      await unlink(filePath);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }
      throw error;
    }
  }
}
