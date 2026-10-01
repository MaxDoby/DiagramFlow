import { Injectable } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto';
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
  DiagramImageUnavailableError,
  DiagramFolderNotFoundError,
  DiagramNotFoundError,
  DiagramVersionConflictError,
  DiagramAlreadySharedError,
  DiagramCollaboratorNotFoundError,
  DiagramOwnerCannotBeCollaboratorError,
} from './errors/diagram.error';
import { Prisma } from '../../../generated/prisma/client';
import { diagramImageFileNames } from './image/diagram-image-references';
import {
  applyDiagramChanges,
  diffDiagramSnapshots,
  persistentDiagramSnapshot,
  diagramOperationSchema,
  diagramSnapshotSchema,
} from '@diagram-flow/contracts';
import type {
  ApplyDiagramOperationInput,
  SyncDiagramOperationsInput,
} from '@diagram-flow/api-ports';

@Injectable()
export class PrismaDiagramRepository implements DiagramRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async applyOperation({
    userId,
    diagramId,
    operation,
  }: ApplyDiagramOperationInput) {
    const input = diagramOperationSchema.parse(operation);
    return this.prisma
      .$transaction(async (tx) => {
        // A row lock serializes all editors of this diagram, including across API instances.
        await tx.$queryRaw`SELECT id FROM diagrams WHERE id = ${diagramId}::uuid FOR UPDATE`;
        const diagram = await tx.diagram.findUnique({
          where: {
            id: diagramId,
            OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
          },
        });
        if (!diagram) throw new DiagramNotFoundError();
        const existing = await tx.diagramOperation.findUnique({
          where: { id: input.id },
        });
        if (existing) {
          if (
            existing.diagramId !== diagramId ||
            existing.userId !== userId ||
            !isDeepStrictEqual(
              existing.payload,
              JSON.parse(JSON.stringify(input.changes)),
            )
          )
            throw new DiagramVersionConflictError();
          return existing;
        }
        const snapshot = persistentDiagramSnapshot(
          applyDiagramChanges(
            diagramSnapshotSchema.parse(diagram.snapshot),
            input.changes,
          ),
        );
        const fileNames = diagramImageFileNames(snapshot);
        if (
          fileNames.length &&
          (await tx.diagramImage.count({
            where: { diagramId, fileName: { in: fileNames } },
          })) !== fileNames.length
        )
          throw new DiagramImageUnavailableError();
        const saved = await tx.diagram.update({
          where: { id: diagramId },
          data: {
            snapshot: snapshot as Prisma.InputJsonValue,
            version: { increment: 1 },
          },
        });
        return tx.diagramOperation.create({
          data: {
            id: input.id,
            diagramId,
            userId,
            version: saved.version,
            payload: input.changes as Prisma.InputJsonValue,
          },
        });
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          throw new DiagramVersionConflictError();
        throw error;
      });
  }

  async syncOperations({
    userId,
    diagramId,
    pendingIds,
  }: SyncDiagramOperationsInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM diagrams WHERE id = ${diagramId}::uuid FOR SHARE`;
      const diagram = await tx.diagram.findUnique({
        where: {
          id: diagramId,
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
        select: { snapshot: true, version: true },
      });
      if (!diagram) throw new DiagramNotFoundError();
      const receipts = await tx.diagramOperation.findMany({
        where: { diagramId, userId, id: { in: pendingIds } },
        select: { id: true },
      });
      return {
        ...diagram,
        acknowledgedIds: receipts.map((receipt) => receipt.id),
      };
    });
  }

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
        images:
          snapshot === undefined
            ? undefined
            : {
                create: diagramImageFileNames(snapshot).map((fileName) => ({
                  fileName,
                })),
              },
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
    // Compatibility for existing clients: their snapshot replacement is also logged.
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM diagrams WHERE id = ${diagramId}::uuid FOR UPDATE`;
      const previous = await tx.diagram.findUnique({
        where: {
          id: diagramId,
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
      });
      if (!previous) throw new DiagramNotFoundError();
      if (previous.version !== expectedVersion)
        throw new DiagramVersionConflictError();
      const fileNames = diagramImageFileNames(snapshot);
      if (fileNames.length > 0) {
        const accessibleImages = await tx.diagramImage.count({
          where: {
            diagramId,
            fileName: { in: fileNames },
            diagram: {
              OR: [
                { ownerId: userId },
                { collaborators: { some: { userId } } },
              ],
            },
          },
        });
        if (accessibleImages !== fileNames.length) {
          throw new DiagramImageUnavailableError();
        }
      }
      try {
        const saved = await tx.diagram.update({
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
        await tx.diagramOperation.create({
          data: {
            id: randomUUID(),
            diagramId,
            userId,
            version: saved.version,
            payload: diffDiagramSnapshots(
              diagramSnapshotSchema.parse(previous.snapshot),
              diagramSnapshotSchema.parse(snapshot),
            ) as Prisma.InputJsonValue,
          },
        });
        return saved;
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          const diagram = await tx.diagram.findUnique({
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
    });
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
