export const DIAGRAM_REPOSITORY_PORT = Symbol('DIAGRAM_REPOSITORY_PORT');

export type DiagramRecord = {
  id: string;
  name: string;
  folderId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface DiagramRepositoryPort {
  applyOperation(
    input: ApplyDiagramOperationInput,
  ): Promise<DiagramOperationRecord>;
  syncOperations(input: SyncDiagramOperationsInput): Promise<DiagramSyncRecord>;
  createForOwner(input: CreateDiagramRepositoryInput): Promise<DiagramRecord>;
  findAllForOwner(
    input: FindAllDiagramsRepositoryInput,
  ): Promise<DiagramRecord[]>;
  findByIdForOwner(
    input: FindDiagramByIdRepositoryInput,
  ): Promise<DiagramDetailsRecord | null>;
  findByIdForUser(
    input: FindDiagramByIdForUserRepositoryInput,
  ): Promise<DiagramDetailsRecord | null>;
  updateForOwner(input: UpdateDiagramRepositoryInput): Promise<DiagramRecord>;
  saveSnapshotForUser(
    input: SaveDiagramSnapshotRepositoryInput,
  ): Promise<SaveDiagramSnapshotRecord>;
  shareWithUser(input: ShareDiagramRepositoryInput): Promise<void>;
  findAllSharedWithUser(
    input: FindAllSharedDiagramsRepositoryInput,
  ): Promise<DiagramRecord[]>;
  deleteForOwner(input: DeleteDiagramRepositoryInput): Promise<void>;
}

export type ApplyDiagramOperationInput = {
  userId: string;
  diagramId: string;
  operation: unknown;
};
export type DiagramOperationRecord = {
  id: string;
  diagramId: string;
  userId: string | null;
  version: number;
  payload: unknown;
};
export type SyncDiagramOperationsInput = {
  userId: string;
  diagramId: string;
  pendingIds: string[];
};
export type DiagramSyncRecord = {
  snapshot: unknown;
  version: number;
  acknowledgedIds: string[];
};

export type DiagramDetailsRecord = DiagramRecord & {
  snapshot: unknown;
};

export type FindDiagramByIdRepositoryInput = {
  ownerId: string;
  diagramId: string;
};

export type FindDiagramByIdForUserRepositoryInput = {
  userId: string;
  diagramId: string;
};

export type CreateDiagramRepositoryInput = {
  ownerId: string;
  name: string;
  folderId?: string;
  snapshot?: unknown;
};

export type UpdateDiagramRepositoryInput = {
  ownerId: string;
  diagramId: string;
  name?: string;
  folderId?: string | null;
};

export type SaveDiagramSnapshotRepositoryInput = {
  userId: string;
  diagramId: string;
  snapshot: unknown;
  expectedVersion: number;
};

export type SaveDiagramSnapshotRecord = {
  version: number;
  updatedAt: Date;
};

export type DeleteDiagramRepositoryInput = {
  ownerId: string;
  diagramId: string;
};

export type FindAllDiagramsRepositoryInput = {
  ownerId: string;
  folderId?: string;
};

export type ShareDiagramRepositoryInput = {
  ownerId: string;
  diagramId: string;
  collaboratorEmail: string;
};

export type FindAllSharedDiagramsRepositoryInput = {
  userId: string;
};
