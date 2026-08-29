import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DIAGRAM_REPOSITORY_PORT } from '@diagram-flow/api-ports';
import { DiagramService } from './diagram.service';
import { PrismaDiagramRepository } from './prisma-diagram.repository';
import { DiagramController } from './diagram.controller';
import { MulterModule } from '@nestjs/platform-express';
import { DiagramImageStorageService } from './image/diagram-image-storage.service';
import { createDiagramImageUploadOptions } from './image/diagram-image-upload.options';

@Module({
  controllers: [DiagramController],
  imports: [
    PrismaModule,
    AuthModule,
    MulterModule.register(createDiagramImageUploadOptions()),
  ],
  providers: [
    DiagramService,
    DiagramImageStorageService,
    {
      provide: DIAGRAM_REPOSITORY_PORT,
      useClass: PrismaDiagramRepository,
    },
  ],
})
export class DiagramModule {}
