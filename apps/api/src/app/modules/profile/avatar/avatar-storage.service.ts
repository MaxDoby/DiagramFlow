import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ensureAvatarUploadDirectory } from './avatar-upload-directory';
import { unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

@Injectable()
export class AvatarStorageService {
  private readonly avatarDirectory: string;

  constructor(configService: ConfigService) {
    this.avatarDirectory = ensureAvatarUploadDirectory(configService);
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
