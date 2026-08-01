import type { ConfigService } from '@nestjs/config';
import type { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createAvatarFileName } from './avatar-file-name';
import { ensureAvatarUploadDirectory } from './avatar-upload-directory';
import { BadRequestException } from '@nestjs/common';
import {
  AVATAR_MAX_FILE_SIZE_BYTES,
  isAllowedAvatarMimeType,
} from './avatar-upload.constants';

export const createAvatarUploadOptions = (
  configService: ConfigService,
): MulterModuleOptions => {
  const destination = ensureAvatarUploadDirectory(configService);

  return {
    storage: diskStorage({
      destination,
      filename: (_request, file, callback) => {
        const fileName = createAvatarFileName(file.mimetype);

        callback(null, fileName);
      },
    }),
    limits: {
      fileSize: AVATAR_MAX_FILE_SIZE_BYTES,
      files: 1,
    },
    fileFilter: (_request, file, callback) => {
      if (!isAllowedAvatarMimeType(file.mimetype)) {
        callback(
          new BadRequestException('Unsupported avatar file type'),
          false,
        );
        return;
      }

      callback(null, true);
    },
  };
};
