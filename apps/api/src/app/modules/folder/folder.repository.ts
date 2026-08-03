import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { FolderRecord } from './types/folderRecord.type';
import {
  FolderNameAlreadyExistsError,
  FolderNotFoundError,
} from './errors/folder.error';

@Injectable()
export class FolderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createForOwner(ownerId: string, name: string): Promise<FolderRecord> {
    try {
      const folder = await this.prisma.folder.create({
        data: {
          ownerId,
          name,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              diagrams: true,
            },
          },
        },
      });
      return {
        id: folder.id,
        name: folder.name,
        diagramCount: folder._count.diagrams,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new FolderNameAlreadyExistsError();
      }
      throw error;
    }
  }

  async findAllForOwner(ownerId: string): Promise<FolderRecord[]> {
    const folders = await this.prisma.folder.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            diagrams: true,
          },
        },
      },
    });

    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      diagramCount: folder._count.diagrams,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));
  }

  async renameOwnedFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderRecord> {
    try {
      const folder = await this.prisma.folder.update({
        where: {
          id: folderId,
          ownerId,
        },
        data: {
          name,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { diagrams: true },
          },
        },
      });

      return {
        id: folder.id,
        name: folder.name,
        diagramCount: folder._count.diagrams,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      };
    } catch (error: unknown) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        throw error;
      }
      if (error.code === 'P2002') throw new FolderNameAlreadyExistsError();
      if (error.code === 'P2025') {
        throw new FolderNotFoundError();
      }
      throw error;
    }
  }

  async deleteOwnedFolder(ownerId: string, folderId: string): Promise<void> {
    try {
      await this.prisma.folder.delete({
        where: {
          id: folderId,
          ownerId,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new FolderNotFoundError();
      }
      throw error;
    }
  }
}
