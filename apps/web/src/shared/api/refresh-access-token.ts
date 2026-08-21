import { refreshResponseSchema } from '@diagram-flow/contracts';
import { clearAccessToken, setAccessToken } from './access-token';

let activeRefreshRequest: Promise<string> | null = null;

const requestAccessToken = async (): Promise<string> => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    clearAccessToken();
    throw new Error('Unable to refresh the access token');
  }

  const payload: unknown = await response.json();
  const result = refreshResponseSchema.parse(payload);

  setAccessToken(result.accessToken);

  return result.accessToken;
};

export const refreshAccessToken = (): Promise<string> => {
  if (!activeRefreshRequest) {
    activeRefreshRequest = requestAccessToken().finally(() => {
      activeRefreshRequest = null;
    });
  }

  return activeRefreshRequest;
};
