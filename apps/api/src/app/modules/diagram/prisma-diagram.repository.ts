import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  CreateDiagramRepositoryInput,
  DiagramRecord,
  DiagramRepositoryPort,
} from '@diagram-flow/api-ports';
import { DiagramFolderNotFoundError } from './errors/diagram.error';

@Injectable()
export class PrismaDiagramRepository implements DiagramRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createForOwner({
    ownerId,
    name,
    folderId,
  }: CreateDiagramRepositoryInput): Promise<DiagramRecord> {
    if (folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: {
          id: folderId,
          ownerId,
        },
      });

      if (!folder) {
        throw new DiagramFolderNotFoundError();
      }
    }

    const diagram = await this.prisma.diagram.create({
      data: {
        ownerId,
        name,
        folderId: folderId ?? null,
      },
      select: {
        id: true,
        name: true,
        folderId: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return diagram;
  }
}
