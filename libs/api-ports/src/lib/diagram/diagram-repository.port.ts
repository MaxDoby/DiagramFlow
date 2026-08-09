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
  createForOwner(input: CreateDiagramRepositoryInput): Promise<DiagramRecord>;
  findAllForOwner(
    input: FindAllDiagramsRepositoryInput,
  ): Promise<DiagramRecord[]>;
  findByIdForOwner(
    input: FindDiagramByIdRepositoryInput,
  ): Promise<DiagramDetailsRecord | null>;
  updateForOwner(input: UpdateDiagramRepositoryInput): Promise<DiagramRecord>;
}

export type DiagramDetailsRecord = DiagramRecord & {
  snapshot: unknown;
};

export type FindDiagramByIdRepositoryInput = {
  ownerId: string;
  diagramId: string;
};

export type CreateDiagramRepositoryInput = {
  ownerId: string;
  name: string;
  folderId?: string;
};

export type UpdateDiagramRepositoryInput = {
  ownerId: string;
  diagramId: string;
  name?: string;
  folderId?: string | null;
};

export type FindAllDiagramsRepositoryInput = {
  ownerId: string;
  folderId?: string;
};
