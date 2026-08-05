import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  type CreateFolderInput,
  type FolderResponse,
  folderResponseSchema,
  folderListResponseSchema,
  type FolderListResponse,
  type UpdateFolderInput,
} from '@diagram-flow/contracts';
import {
  FOLDER_REPOSITORY_PORT,
  type FolderRepositoryPort,
} from '@diagram-flow/api-ports';
import {
  FolderNameAlreadyExistsError,
  FolderNotFoundError,
} from './errors/folder.error';

@Injectable()
export class FolderService {
  constructor(
    @Inject(FOLDER_REPOSITORY_PORT)
    private readonly folderRepository: FolderRepositoryPort,
  ) {}

  async createFolder(
    userId: string,
    input: CreateFolderInput,
  ): Promise<FolderResponse> {
    try {
      const folder = await this.folderRepository.createForOwner({
        ownerId: userId,
        name: input.name,
      });
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
    const folders = await this.folderRepository.findAllForOwner({
      ownerId: userId,
    });

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
      const folder = await this.folderRepository.renameOwnedFolder({
        ownerId: userId,
        folderId,
        name: input.name,
      });

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
      await this.folderRepository.deleteOwnedFolder({
        ownerId: userId,
        folderId,
      });
    } catch (error: unknown) {
      if (error instanceof FolderNotFoundError) {
        throw new NotFoundException('Folder not found');
      }

      throw error;
    }
  }
}
