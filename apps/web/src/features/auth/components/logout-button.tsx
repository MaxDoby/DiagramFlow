import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { clearAccessToken } from '../../../shared/api/access-token';
import { logoutUser } from '../api/logout-api';

export const LogoutButton = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      clearAccessToken();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return (
    <button
      className="flex size-10 shrink-0 items-center justify-center
        rounded-md border border-zinc-300 bg-white text-zinc-700
        hover:bg-zinc-100 disabled:cursor-not-allowed
        disabled:opacity-60"
      type="button"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
      aria-label={logoutMutation.isPending ? 'Signing out' : 'Sign out'}
      title={logoutMutation.isPending ? 'Signing out' : 'Sign out'}
    >
      <LogOut
        className={`size-5 ${logoutMutation.isPending ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
};
