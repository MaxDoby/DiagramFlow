import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';

export const ensureAvatarUploadDirectory = (
  configService: ConfigService,
): string => {
  const uploadsRoot = configService.getOrThrow<string>('UPLOADS_ROOT');

  const avatarDirectory = resolve(process.cwd(), uploadsRoot, 'avatars');

  mkdirSync(avatarDirectory, {
    recursive: true,
  });

  return avatarDirectory;
};
