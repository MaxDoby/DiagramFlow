import {
  diagramDetailsResponseSchema,
  type DiagramDetailsResponse,
} from '@diagram-flow/contracts';

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
