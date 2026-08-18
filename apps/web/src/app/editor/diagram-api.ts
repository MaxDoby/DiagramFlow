import {
  createDiagramSchema,
  diagramSummaryResponseSchema,
  type CreateDiagramInput,
  type DiagramSummaryResponse,
  diagramDetailsResponseSchema,
  diagramListResponseSchema,
  type DiagramDetailsResponse,
  type DiagramListResponse,
  type SaveDiagramSnapshotInput,
  type SaveDiagramSnapshotResponse,
  saveDiagramSnapshotResponseSchema,
  updateDiagramSchema,
  type UpdateDiagramInput,
} from '@diagram-flow/contracts';
import { throwApiError } from '../api/throw-api-error';

import { apiRequest } from '../api/api-client';

export class DiagramApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = DiagramApiError.name;
  }
}

export const listDiagrams = async (
  folderId?: string,
): Promise<DiagramListResponse> => {
  const path = folderId
    ? `/api/diagrams?${new URLSearchParams({ folderId })}`
    : '/api/diagrams';

  const response = await apiRequest(path);

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return diagramListResponseSchema.parse(payload);
};

export const createDiagram = async (
  input: CreateDiagramInput,
): Promise<DiagramSummaryResponse> => {
  const validatedInput = createDiagramSchema.parse(input);

  const response = await apiRequest('/api/diagrams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return diagramSummaryResponseSchema.parse(payload);
};

export const updateDiagram = async (
  diagramId: string,
  input: UpdateDiagramInput,
): Promise<DiagramSummaryResponse> => {
  const validatedInput = updateDiagramSchema.parse(input);

  const response = await apiRequest(`/api/diagrams/${diagramId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return diagramSummaryResponseSchema.parse(payload);
};

export const deleteDiagram = async (diagramId: string): Promise<void> => {
  const response = await apiRequest(`/api/diagrams/${diagramId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    await throwApiError(response);
  }
};

export const getDiagram = async (
  diagramId: string,
): Promise<DiagramDetailsResponse> => {
  const response = await apiRequest(`/api/diagrams/${diagramId}`);

  if (!response.ok) {
    throw new DiagramApiError(response.status, 'Unable to load the diagram');
  }

  const payload: unknown = await response.json();

  return diagramDetailsResponseSchema.parse(payload);
};

export const saveDiagramSnapshot = async (
  diagramId: string,
  input: SaveDiagramSnapshotInput,
): Promise<SaveDiagramSnapshotResponse> => {
  const response = await apiRequest(`/api/diagrams/${diagramId}/snapshot`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new DiagramApiError(response.status, 'Unable to save the diagram');
  }

  const payload: unknown = await response.json();

  return saveDiagramSnapshotResponseSchema.parse(payload);
};
