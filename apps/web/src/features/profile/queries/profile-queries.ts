import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
} from '../api/profile-api';
import { clearAccessToken } from '../../../shared/api/access-token';

export const profileQueryKeys = {
  current: ['profile', 'current'] as const,
};

export const useProfileQuery = () =>
  useQuery({
    queryKey: profileQueryKeys.current,
    queryFn: getProfile,
  });

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.current, profile);
    },
  });
};

export const useUpdateAvatarMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAvatar,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.current, profile);
    },
  });
};

export const useChangePasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      clearAccessToken();
      queryClient.clear();
    },
  });
};
