import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { PrismaFolderRepository } from './prisma-folder.repository';
import { FOLDER_REPOSITORY_PORT } from '@diagram-flow/api-ports';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FolderController],
  providers: [
    FolderService,
    {
      provide: FOLDER_REPOSITORY_PORT,
      useClass: PrismaFolderRepository,
    },
  ],
})
export class FolderModule {}
