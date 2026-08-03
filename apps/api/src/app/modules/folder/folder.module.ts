import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { FolderRepository } from './folder.repository';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
})
export class FolderModule {}
