import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DIAGRAM_REPOSITORY_PORT } from '@diagram-flow/api-ports';
import { DiagramService } from './diagram.service';
import { PrismaDiagramRepository } from './prisma-diagram.repository';
import { DiagramController } from './diagram.controller';

@Module({
  controllers: [DiagramController],
  imports: [PrismaModule, AuthModule],
  providers: [
    DiagramService,
    {
      provide: DIAGRAM_REPOSITORY_PORT,
      useClass: PrismaDiagramRepository,
    },
  ],
})
export class DiagramModule {}
