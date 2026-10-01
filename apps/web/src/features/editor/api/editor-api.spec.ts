import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../../../shared/api/api-client';
import { DiagramApiError, getDiagram, saveDiagramSnapshot } from './editor-api';

vi.mock('../../../shared/api/api-client', () => ({
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

describe('saveDiagramSnapshot', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('sends the snapshot and returns the new version', async () => {
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const updatedAt = '2030-01-01T12:00:00.000Z';
    const input = {
      snapshot: {
        nodes: [
          {
            id: 'node-1',
            position: {
              x: 120,
              y: 80,
            },
            data: {
              label: 'API Gateway',
            },
          },
        ],
        edges: [],
        viewport: {
          x: 10,
          y: 20,
          zoom: 1.25,
        },
      },
      expectedVersion: 3,
    };

    apiRequestMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          version: 4,
          updatedAt,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const result = await saveDiagramSnapshot(diagramId, input);

    expect(apiRequestMock).toHaveBeenCalledWith(
      `/api/diagrams/${diagramId}/snapshot`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
    );
    expect(result).toEqual({
      version: 4,
      updatedAt,
    });
  });

  it('throws DiagramApiError when the version is stale', async () => {
    const diagramId = '22222222-2222-4222-8222-222222222222';

    apiRequestMock.mockResolvedValue(
      new Response(null, {
        status: 409,
      }),
    );

    let receivedError: unknown;

    try {
      await saveDiagramSnapshot(diagramId, {
        snapshot: {
          nodes: [],
          edges: [],
          viewport: {
            x: 0,
            y: 0,
            zoom: 1,
          },
        },
        expectedVersion: 3,
      });
    } catch (error: unknown) {
      receivedError = error;
    }

    expect(receivedError).toBeInstanceOf(DiagramApiError);
    expect((receivedError as DiagramApiError).status).toBe(409);
  });
});
