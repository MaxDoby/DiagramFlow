export const FOLDER_REPOSITORY_PORT = Symbol('FOLDER_REPOSITORY_PORT');

export type FolderRecord = {
  id: string;
  name: string;
  diagramCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateFolderRepositoryInput = {
  ownerId: string;
  name: string;
};

export type FindAllFoldersRepositoryInput = {
  ownerId: string;
};

export type RenameFolderRepositoryInput = {
  ownerId: string;
  folderId: string;
  name: string;
};

export type DeleteFolderRepositoryInput = {
  ownerId: string;
  folderId: string;
};

export interface FolderRepositoryPort {
  createForOwner(input: CreateFolderRepositoryInput): Promise<FolderRecord>;
  findAllForOwner(
    input: FindAllFoldersRepositoryInput,
  ): Promise<FolderRecord[]>;
  renameOwnedFolder(input: RenameFolderRepositoryInput): Promise<FolderRecord>;
  deleteOwnedFolder(input: DeleteFolderRepositoryInput): Promise<void>;
}
