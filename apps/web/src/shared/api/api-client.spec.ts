import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, setAccessToken } from './access-token';
import { apiRequest } from './api-client';

describe('apiRequest', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the current access token with the request', async () => {
    setAccessToken('current-access-token');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const response = await apiRequest('/api/diagrams/diagram-id');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = requestInit.headers as Headers;

    expect(requestInit.credentials).toBe('include');
    expect(headers.get('Authorization')).toBe('Bearer current-access-token');
  });

  it('refreshes the access token and retries once after a 401 response', async () => {
    const refreshedAccessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQifQ.dGVzdC1zaWduYXR1cmU';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: refreshedAccessToken,
            accessTokenExpiresInSeconds: 900,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const response = await apiRequest('/api/diagrams/diagram-id');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');

    const retriedRequestInit = fetchMock.mock.calls[2][1] as RequestInit;
    const retriedHeaders = retriedRequestInit.headers as Headers;

    expect(retriedHeaders.get('Authorization')).toBe(
      `Bearer ${refreshedAccessToken}`,
    );
  });

  it('retries only once when the retried request also returns 401', async () => {
    const refreshedAccessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQifQ.dGVzdC1zaWduYXR1cmU';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: refreshedAccessToken,
            accessTokenExpiresInSeconds: 900,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await apiRequest('/api/diagrams/diagram-id');

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
