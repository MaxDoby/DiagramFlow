import { clearAccessToken, getAccessToken } from '../auth/access-token';
import { refreshAccessToken } from '../auth/refresh-access-token';

const executeRequest = (
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<Response> => {
  const headers = new Headers(init.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });
};

export const apiRequest = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const response = await executeRequest(path, init, getAccessToken());

  if (response.status !== 401) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken();
  const retriedResponse = await executeRequest(
    path,
    init,
    refreshedAccessToken,
  );

  if (retriedResponse.status === 401) {
    clearAccessToken();
  }

  return retriedResponse;
};
