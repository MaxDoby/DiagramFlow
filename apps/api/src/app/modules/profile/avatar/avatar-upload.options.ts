import type { MulterModuleOptions } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import {
  AVATAR_MAX_FILE_SIZE_BYTES,
  isAllowedAvatarMimeType,
} from './avatar-upload.constants';

export const createAvatarUploadOptions = (): MulterModuleOptions => ({
  storage: memoryStorage(),
  limits: { fileSize: AVATAR_MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedAvatarMimeType(file.mimetype)) {
      callback(new BadRequestException('Unsupported avatar file type'), false);
      return;
    }
    callback(null, true);
  },
});
