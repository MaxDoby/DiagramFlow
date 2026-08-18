import {
  folderListResponseSchema,
  type FolderListResponse,
  createFolderSchema,
  folderResponseSchema,
  type CreateFolderInput,
  type FolderResponse,
} from '@diagram-flow/contracts';
import { apiRequest } from '../api/api-client';
import { throwApiError } from '../api/throw-api-error';

export const listFolders = async (): Promise<FolderListResponse> => {
  const response = await apiRequest('/api/folders');

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return folderListResponseSchema.parse(payload);
};

export const createFolder = async (
  input: CreateFolderInput,
): Promise<FolderResponse> => {
  const validatedInput = createFolderSchema.parse(input);

  const response = await apiRequest('/api/folders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return folderResponseSchema.parse(payload);
};
