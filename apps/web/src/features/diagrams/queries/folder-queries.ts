import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createFolder, deleteFolder, listFolders } from '../api/folders-api';

export const folderQueryKeys = {
  all: ['folders'] as const,
};

export const useFoldersQuery = () =>
  useQuery({
    queryKey: folderQueryKeys.all,
    queryFn: listFolders,
  });

export const useCreateFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all }),
  });
};

export const useDeleteFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ['diagrams'],
        }),
      ]);
    },
  });
};
