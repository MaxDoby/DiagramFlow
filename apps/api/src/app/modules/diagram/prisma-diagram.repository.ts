import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  CreateDiagramRepositoryInput,
  DiagramRecord,
  DiagramRepositoryPort,
  FindAllDiagramsRepositoryInput,
  DiagramDetailsRecord,
  FindDiagramByIdRepositoryInput,
  UpdateDiagramRepositoryInput,
  DeleteDiagramRepositoryInput,
} from '@diagram-flow/api-ports';
import {
  DiagramFolderNotFoundError,
  DiagramNotFoundError,
} from './errors/diagram.error';
import { Prisma } from '../../../generated/prisma/client';

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

  async updateForOwner({
    ownerId,
    diagramId,
    name,
    folderId,
  }: UpdateDiagramRepositoryInput): Promise<DiagramRecord> {
    if (folderId !== undefined && folderId !== null) {
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

    try {
      const updatedDiagram = await this.prisma.diagram.update({
        where: {
          id: diagramId,
          ownerId,
        },
        data: {
          name,
          folderId,
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

      return updatedDiagram;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new DiagramNotFoundError();
      }
      throw error;
    }
  }

  async deleteForOwner({
    ownerId,
    diagramId,
  }: DeleteDiagramRepositoryInput): Promise<void> {
    try {
      await this.prisma.diagram.delete({
        where: {
          id: diagramId,
          ownerId,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new DiagramNotFoundError();
      }
      throw error;
    }
  }

  async findAllForOwner(
    input: FindAllDiagramsRepositoryInput,
  ): Promise<DiagramRecord[]> {
    const diagramsList = await this.prisma.diagram.findMany({
      where: {
        ownerId: input.ownerId,
        ...(input.folderId ? { folderId: input.folderId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        folderId: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return diagramsList;
  }

  async findByIdForOwner({
    ownerId,
    diagramId,
  }: FindDiagramByIdRepositoryInput): Promise<DiagramDetailsRecord | null> {
    const diagram = await this.prisma.diagram.findUnique({
      where: {
        id: diagramId,
        ownerId,
      },
      select: {
        id: true,
        name: true,
        folderId: true,
        snapshot: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return diagram;
  }
}
