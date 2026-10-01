import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const ensureDiagramImageUploadDirectory = (
  configService: ConfigService,
): string => {
  const uploadsRoot = configService.getOrThrow<string>('UPLOADS_ROOT');
  const directory = resolve(process.cwd(), uploadsRoot, 'diagram-images');

  mkdirSync(directory, { recursive: true });

  return directory;
};
