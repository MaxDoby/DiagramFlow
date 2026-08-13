import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../api/api-client';
import { DiagramApiError, getDiagram } from './diagram-api';

vi.mock('../api/api-client', () => ({
  apiRequest: vi.fn(),
}));

const apiRequestMock = vi.mocked(apiRequest);

describe('getDiagram', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('returns a validated diagram response', async () => {
    const timestamp = '2030-01-01T12:00:00.000Z';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    apiRequestMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: diagramId,
          name: 'System Architecture',
          folderId: null,
          version: 0,
          snapshot: {},
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const result = await getDiagram(diagramId);

    expect(apiRequestMock).toHaveBeenCalledWith(`/api/diagrams/${diagramId}`);

    expect(result.snapshot).toEqual({
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    });
  });

  it('throws DiagramApiError with the response status', async () => {
    const diagramId = '22222222-2222-4222-8222-222222222222';

    apiRequestMock.mockResolvedValue(
      new Response(null, {
        status: 404,
      }),
    );

    let receivedError: unknown;

    try {
      await getDiagram(diagramId);
    } catch (error: unknown) {
      receivedError = error;
    }

    expect(receivedError).toBeInstanceOf(DiagramApiError);
    expect((receivedError as DiagramApiError).status).toBe(404);
  });
});
