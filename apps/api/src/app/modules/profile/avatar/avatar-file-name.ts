import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  AVATAR_EXTENSION_BY_MIME_TYPE,
  isAllowedAvatarMimeType,
} from './avatar-upload.constants';

export const createAvatarFileName = (mimeType: string): string => {
  if (!isAllowedAvatarMimeType(mimeType))
    throw new BadRequestException('Unsupported avatar file type');

  const extension = AVATAR_EXTENSION_BY_MIME_TYPE[mimeType];

  const result = `${randomUUID()}.${extension}`;

  return result;
};
