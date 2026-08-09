import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  DIAGRAM_REPOSITORY_PORT,
  DiagramRepositoryPort,
} from '@diagram-flow/api-ports';
import {
  CreateDiagramInput,
  DiagramDetailsResponse,
  diagramDetailsResponseSchema,
  DiagramListResponse,
  diagramListResponseSchema,
  diagramSummaryResponseSchema,
} from '@diagram-flow/contracts';
import { DiagramFolderNotFoundError } from './errors/diagram.error';

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

      return diagramSummaryResponseSchema.parse({
        id: diagram.id,
        name: diagram.name,
        folderId: diagram.folderId,
        version: diagram.version,
        createdAt: diagram.createdAt.toISOString(),
        updatedAt: diagram.updatedAt.toISOString(),
      });
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
}
