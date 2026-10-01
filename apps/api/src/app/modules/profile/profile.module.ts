import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { MulterModule } from '@nestjs/platform-express';
import { createAvatarUploadOptions } from './avatar/avatar-upload.options';
import { AvatarStorageService } from './avatar/avatar-storage.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MulterModule.register(createAvatarUploadOptions()),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, AvatarStorageService],
})
export class ProfileModule {}
