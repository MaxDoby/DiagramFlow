import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateDiagramInput,
  ShareDiagramInput,
} from '@diagram-flow/contracts';

import {
  createDiagram,
  deleteDiagram,
  listDiagrams,
  updateDiagram,
  duplicateDiagram,
  listSharedDiagrams,
  shareDiagram,
} from '../api/diagrams-api';
import { folderQueryKeys } from './folder-queries';

export const diagramQueryKeys = {
  all: ['diagrams'] as const,
  list: (folderId?: string) =>
    [...diagramQueryKeys.all, folderId ?? 'all'] as const,
  shared: ['diagrams', 'shared'] as const,
};

export const useDiagramsQuery = (folderId?: string) =>
  useQuery({
    queryKey: diagramQueryKeys.list(folderId),
    queryFn: () => listDiagrams(folderId),
  });

export const useSharedDiagramsQuery = () =>
  useQuery({
    queryKey: diagramQueryKeys.shared,
    queryFn: listSharedDiagrams,
  });

export const useCreateDiagramMutation = () =>
  useMutation({ mutationFn: createDiagram });

export const useShareDiagramMutation = (diagramId: string) =>
  useMutation({
    mutationFn: (input: ShareDiagramInput) => shareDiagram(diagramId, input),
  });

export const useRenameDiagramMutation = (diagramId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDiagramInput) => updateDiagram(diagramId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: diagramQueryKeys.all }),
  });
};

export const useMoveDiagramMutation = (diagramId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string | null) =>
      updateDiagram(diagramId, { folderId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: diagramQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: folderQueryKeys.all }),
      ]);
    },
  });
};

export const useDeleteDiagramMutation = (diagramId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteDiagram(diagramId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: diagramQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: folderQueryKeys.all }),
      ]);
    },
  });
};

export const useDuplicateDiagramMutation = (diagramId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => duplicateDiagram(diagramId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: diagramQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.all,
        }),
      ]);
    },
  });
};
