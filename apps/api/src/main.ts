import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.use(cookieParser());
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  const configService = app.get(ConfigService);
  const uploadsRoot = configService.getOrThrow<string>('UPLOADS_ROOT');

  const avatarsDirectory = resolve(process.cwd(), uploadsRoot, 'avatars');

  app.useStaticAssets(avatarsDirectory, {
    prefix: '/uploads/avatars/',
    immutable: true,
    maxAge: '1y',
  });

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
