import {
  diagramDetailsResponseSchema,
  type DiagramDetailsResponse,
  type SaveDiagramSnapshotInput,
  type SaveDiagramSnapshotResponse,
  saveDiagramSnapshotResponseSchema,
} from '@diagram-flow/contracts';

import { apiRequest } from '../../../shared/api/api-client';

export class DiagramApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = DiagramApiError.name;
  }
}

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
