import { throwApiError } from '../../../shared/api/throw-api-error';

export const logoutUser = async (): Promise<void> => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    await throwApiError(response);
  }
};
