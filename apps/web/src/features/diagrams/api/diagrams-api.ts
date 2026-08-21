import {
  createDiagramSchema,
  diagramListResponseSchema,
  diagramSummaryResponseSchema,
  type CreateDiagramInput,
  type DiagramListResponse,
  type DiagramSummaryResponse,
  type UpdateDiagramInput,
  updateDiagramSchema,
} from '@diagram-flow/contracts';

import { apiRequest } from '../../../shared/api/api-client';
import { throwApiError } from '../../../shared/api/throw-api-error';

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
