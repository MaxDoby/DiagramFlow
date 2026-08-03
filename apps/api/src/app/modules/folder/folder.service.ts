import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  type CreateFolderInput,
  type FolderResponse,
  folderResponseSchema,
  folderListResponseSchema,
  type FolderListResponse,
  type UpdateFolderInput,
} from '@diagram-flow/contracts';
import { FolderRepository } from './folder.repository';
import {
  FolderNameAlreadyExistsError,
  FolderNotFoundError,
} from './errors/folder.error';

@Injectable()
export class FolderService {
  constructor(private readonly folderRepository: FolderRepository) {}

  async createFolder(
    userId: string,
    input: CreateFolderInput,
  ): Promise<FolderResponse> {
    try {
      const folder = await this.folderRepository.createForOwner(
        userId,
        input.name,
      );
      return folderResponseSchema.parse({
        id: folder.id,
        name: folder.name,
        diagramCount: folder.diagramCount,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof FolderNameAlreadyExistsError) {
        throw new ConflictException('Folder name already exists');
      }
      throw error;
    }
  }

  async listFolders(userId: string): Promise<FolderListResponse> {
    const folders = await this.folderRepository.findAllForOwner(userId);

    const response = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      diagramCount: folder.diagramCount,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    }));

    return folderListResponseSchema.parse(response);
  }

  async renameFolder(
    userId: string,
    folderId: string,
    input: UpdateFolderInput,
  ): Promise<FolderResponse> {
    try {
      const folder = await this.folderRepository.renameOwnedFolder(
        userId,
        folderId,
        input.name,
      );

      return folderResponseSchema.parse({
        id: folder.id,
        name: folder.name,
        diagramCount: folder.diagramCount,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof FolderNameAlreadyExistsError) {
        throw new ConflictException('Folder name already exists');
      }
      if (error instanceof FolderNotFoundError) {
        throw new NotFoundException('Folder not found');
      }
      throw error;
    }
  }

  async deleteFolder(userId: string, folderId: string): Promise<void> {
    try {
      await this.folderRepository.deleteOwnedFolder(userId, folderId);
    } catch (error: unknown) {
      if (error instanceof FolderNotFoundError) {
        throw new NotFoundException('Folder not found');
      }

      throw error;
    }
  }
}
