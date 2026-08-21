import {
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  DIAGRAM_REPOSITORY_PORT,
  DiagramRepositoryPort,
  type DiagramRecord,
} from '@diagram-flow/api-ports';
import {
  CreateDiagramInput,
  DiagramDetailsResponse,
  diagramDetailsResponseSchema,
  DiagramListResponse,
  diagramListResponseSchema,
  DiagramSummaryResponse,
  diagramSummaryResponseSchema,
  UpdateDiagramInput,
  SaveDiagramSnapshotInput,
  SaveDiagramSnapshotResponse,
  saveDiagramSnapshotResponseSchema,
} from '@diagram-flow/contracts';
import {
  DiagramFolderNotFoundError,
  DiagramNotFoundError,
  DiagramVersionConflictError,
} from './errors/diagram.error';

const DIAGRAM_NAME_MAX_LENGTH = 150;
const DUPLICATE_NAME_SUFFIX = ' copy';

const toDiagramSummaryResponse = (
  diagram: DiagramRecord,
): DiagramSummaryResponse => {
  return diagramSummaryResponseSchema.parse({
    id: diagram.id,
    name: diagram.name,
    folderId: diagram.folderId,
    version: diagram.version,
    createdAt: diagram.createdAt.toISOString(),
    updatedAt: diagram.updatedAt.toISOString(),
  });
};

@Injectable()
export class DiagramService {
  constructor(
    @Inject(DIAGRAM_REPOSITORY_PORT)
    private readonly diagramRepository: DiagramRepositoryPort,
  ) {}

  async createDiagram(userId: string, input: CreateDiagramInput) {
    try {
      const diagram = await this.diagramRepository.createForOwner({
        ownerId: userId,
        name: input.name,
        folderId: input.folderId,
      });

      return toDiagramSummaryResponse(diagram);
    } catch (error: unknown) {
      if (error instanceof DiagramFolderNotFoundError) {
        throw new NotFoundException('Folder not found');
      }
      throw error;
    }
  }

  async listDiagrams(
    userId: string,
    folderId?: string,
  ): Promise<DiagramListResponse> {
    const diagramsList = await this.diagramRepository.findAllForOwner({
      ownerId: userId,
      folderId,
    });

    const response = diagramsList.map((diagram) => ({
      id: diagram.id,
      name: diagram.name,
      folderId: diagram.folderId,
      version: diagram.version,
      createdAt: diagram.createdAt.toISOString(),
      updatedAt: diagram.updatedAt.toISOString(),
    }));

    return diagramListResponseSchema.parse(response);
  }

  async getDiagram(
    userId: string,
    diagramId: string,
  ): Promise<DiagramDetailsResponse> {
    const diagram = await this.diagramRepository.findByIdForOwner({
      ownerId: userId,
      diagramId,
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const response = diagramDetailsResponseSchema.parse({
      id: diagram.id,
      name: diagram.name,
      folderId: diagram.folderId,
      snapshot: diagram.snapshot,
      version: diagram.version,
      createdAt: diagram.createdAt.toISOString(),
      updatedAt: diagram.updatedAt.toISOString(),
    });

    return response;
  }

  async updateDiagram(
    userId: string,
    diagramId: string,
    input: UpdateDiagramInput,
  ): Promise<DiagramSummaryResponse> {
    try {
      const updatedDiagram = await this.diagramRepository.updateForOwner({
        ownerId: userId,
        diagramId,
        name: input.name,
        folderId: input.folderId,
      });

      return toDiagramSummaryResponse(updatedDiagram);
    } catch (error: unknown) {
      if (error instanceof DiagramFolderNotFoundError) {
        throw new NotFoundException('Folder not found');
      }
      if (error instanceof DiagramNotFoundError) {
        throw new NotFoundException('Diagram not found');
      }
      throw error;
    }
  }

  async saveSnapshot(
    userId: string,
    diagramId: string,
    input: SaveDiagramSnapshotInput,
  ): Promise<SaveDiagramSnapshotResponse> {
    try {
      const savedSnapshot = await this.diagramRepository.saveSnapshotForOwner({
        ownerId: userId,
        diagramId,
        snapshot: input.snapshot,
        expectedVersion: input.expectedVersion,
      });

      return saveDiagramSnapshotResponseSchema.parse({
        version: savedSnapshot.version,
        updatedAt: savedSnapshot.updatedAt.toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof DiagramNotFoundError) {
        throw new NotFoundException('Diagram not found');
      }
      if (error instanceof DiagramVersionConflictError) {
        throw new ConflictException('Diagram was modified by another user');
      }
      throw error;
    }
  }

  async deleteDiagram(userId: string, diagramId: string): Promise<void> {
    try {
      await this.diagramRepository.deleteForOwner({
        ownerId: userId,
        diagramId,
      });
    } catch (error: unknown) {
      if (error instanceof DiagramNotFoundError) {
        throw new NotFoundException('Diagram not found');
      }
      throw error;
    }
  }

  async duplicateDiagram(
    userId: string,
    diagramId: string,
  ): Promise<DiagramSummaryResponse> {
    const sourceDiagram = await this.diagramRepository.findByIdForOwner({
      ownerId: userId,
      diagramId,
    });

    if (!sourceDiagram) {
      throw new NotFoundException('Diagram not found');
    }

    const availableNameLength =
      DIAGRAM_NAME_MAX_LENGTH - DUPLICATE_NAME_SUFFIX.length;
    const duplicateName = `${sourceDiagram.name.slice(0, availableNameLength)}${DUPLICATE_NAME_SUFFIX}`;

    try {
      const duplicateDiagram = await this.diagramRepository.createForOwner({
        ownerId: userId,
        name: duplicateName,
        folderId: sourceDiagram.folderId ?? undefined,
        snapshot: sourceDiagram.snapshot,
      });

      return toDiagramSummaryResponse(duplicateDiagram);
    } catch (error: unknown) {
      if (error instanceof DiagramFolderNotFoundError) {
        throw new NotFoundException('Folder not found');
      }
      throw error;
    }
  }
}
