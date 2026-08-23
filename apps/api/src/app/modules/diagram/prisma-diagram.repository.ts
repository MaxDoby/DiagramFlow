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
  SaveDiagramSnapshotRecord,
  SaveDiagramSnapshotRepositoryInput,
  FindAllSharedDiagramsRepositoryInput,
  ShareDiagramRepositoryInput,
  FindDiagramByIdForUserRepositoryInput,
} from '@diagram-flow/api-ports';
import {
  DiagramFolderNotFoundError,
  DiagramNotFoundError,
  DiagramVersionConflictError,
  DiagramAlreadySharedError,
  DiagramCollaboratorNotFoundError,
  DiagramOwnerCannotBeCollaboratorError,
} from './errors/diagram.error';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class PrismaDiagramRepository implements DiagramRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createForOwner({
    ownerId,
    name,
    folderId,
    snapshot,
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
        snapshot:
          snapshot === undefined
            ? undefined
            : (snapshot as Prisma.InputJsonValue),
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

  async saveSnapshotForUser({
    userId,
    diagramId,
    snapshot,
    expectedVersion,
  }: SaveDiagramSnapshotRepositoryInput): Promise<SaveDiagramSnapshotRecord> {
    try {
      return await this.prisma.diagram.update({
        where: {
          id: diagramId,
          OR: [
            {
              ownerId: userId,
            },
            {
              collaborators: {
                some: {
                  userId,
                },
              },
            },
          ],
          version: expectedVersion,
        },
        data: {
          snapshot: snapshot as Prisma.InputJsonValue,
          version: {
            increment: 1,
          },
        },
        select: {
          version: true,
          updatedAt: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        const diagram = await this.prisma.diagram.findUnique({
          where: {
            id: diagramId,
            OR: [
              {
                ownerId: userId,
              },
              {
                collaborators: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
          select: {
            id: true,
          },
        });
        if (!diagram) {
          throw new DiagramNotFoundError();
        }
        throw new DiagramVersionConflictError();
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

  async shareWithUser({
    ownerId,
    diagramId,
    collaboratorEmail,
  }: ShareDiagramRepositoryInput): Promise<void> {
    const [diagram, collaborator] = await this.prisma.$transaction([
      this.prisma.diagram.findUnique({
        where: {
          id: diagramId,
          ownerId,
        },
        select: {
          id: true,
        },
      }),
      this.prisma.user.findUnique({
        where: {
          email: collaboratorEmail,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!diagram) {
      throw new DiagramNotFoundError();
    }

    if (!collaborator) {
      throw new DiagramCollaboratorNotFoundError();
    }

    if (collaborator.id === ownerId) {
      throw new DiagramOwnerCannotBeCollaboratorError();
    }

    try {
      await this.prisma.diagramCollaborator.create({
        data: {
          diagramId,
          userId: collaborator.id,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DiagramAlreadySharedError();
      }
      throw error;
    }
  }

  async findAllSharedWithUser({
    userId,
  }: FindAllSharedDiagramsRepositoryInput): Promise<DiagramRecord[]> {
    return this.prisma.diagram.findMany({
      where: {
        collaborators: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
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

  async findByIdForUser({
    userId,
    diagramId,
  }: FindDiagramByIdForUserRepositoryInput): Promise<DiagramDetailsRecord | null> {
    return this.prisma.diagram.findUnique({
      where: {
        id: diagramId,
        OR: [
          {
            ownerId: userId,
          },
          {
            collaborators: {
              some: {
                userId,
              },
            },
          },
        ],
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
