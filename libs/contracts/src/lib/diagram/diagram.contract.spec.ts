import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  createDiagramSchema,
  diagramParamsSchema,
  diagramSummaryResponseSchema,
  diagramListQuerySchema,
  diagramDetailsResponseSchema,
  updateDiagramSchema,
  diagramSnapshotSchema,
  saveDiagramSnapshotSchema,
} from './diagram.contract';

describe('createDiagramSchema', () => {
  it('trims a valid name without a folder', () => {
    const result = createDiagramSchema.parse({
      name: '  System Architecture  ',
    });

    expect(result.name).toBe('System Architecture');
    expect(result.folderId).toBe(undefined);
  });

  it('accepts a valid folder id', () => {
    const folderId = randomUUID();
    const result = createDiagramSchema.safeParse({
      name: 'System Arhitecture',
      folderId: folderId,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid folder id', () => {
    const result = createDiagramSchema.safeParse({
      name: 'System Arhitecture',
      folderId: 'invalid Id',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 150 characters', () => {
    const result = createDiagramSchema.safeParse({
      name: 'a'.repeat(151),
    });

    expect(result.success).toBe(false);
  });
});

describe('updateDiagramSchema', () => {
  it('trims a valid updated name', () => {
    const result = updateDiagramSchema.parse({
      name: '    Updated Architecture  ',
    });

    expect(result.name).toBe('Updated Architecture');
  });

  it('accepts moving a diagram to a folder', () => {
    const folderId = randomUUID();

    const result = updateDiagramSchema.safeParse({ folderId });

    expect(result.success).toBe(true);
  });

  it('accepts moving a diagram to root', () => {
    const result = updateDiagramSchema.safeParse({
      folderId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty update', () => {
    const result = updateDiagramSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('diagramSnapshotSchema', () => {
  it('normalizes an empty snapshot', () => {
    const result = diagramSnapshotSchema.parse({});

    expect(result).toEqual({
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    });
  });

  it('accepts a valid React Flow snapshot', () => {
    const sourceNodeId = randomUUID();
    const targetNodeId = randomUUID();

    const result = diagramSnapshotSchema.safeParse({
      nodes: [
        {
          id: sourceNodeId,
          position: { x: 80, y: 80 },
          data: { label: 'API Gateway' },
        },
        {
          id: targetNodeId,
          position: { x: 320, y: 80 },
          data: { label: 'Database' },
        },
      ],
      edges: [
        {
          id: randomUUID(),
          source: sourceNodeId,
          target: targetNodeId,
        },
      ],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a viewport with a non-positive zoom', () => {
    const result = diagramSnapshotSchema.safeParse({
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 0,
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('saveDiagramSnapshotSchema', () => {
  it('accepts a snapshot with the expected version', () => {
    const result = saveDiagramSnapshotSchema.safeParse({
      snapshot: {},
      expectedVersion: 0,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a negative expected version', () => {
    const result = saveDiagramSnapshotSchema.safeParse({
      snapshot: {},
      expectedVersion: -1,
    });

    expect(result.success).toBe(false);
  });
});

describe('diagramParamsSchema', () => {
  it('rejects an invalid diagram id', () => {
    const result = diagramParamsSchema.safeParse({
      diagramId: 'invalid id',
    });

    expect(result.success).toBe(false);
  });
});

describe('diagramSummaryResponseSchema', () => {
  it('accepts a valid summary response', () => {
    const timestamp = new Date().toISOString();

    const result = diagramSummaryResponseSchema.safeParse({
      id: randomUUID(),
      name: 'System Arhitecture',
      folderId: null,
      version: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(true);
  });
});

describe('diagramListQuerySchema', () => {
  it('rejects an invalid folder id', () => {
    const result = diagramListQuerySchema.safeParse({
      folderId: 'invalid id',
    });

    expect(result.success).toBe(false);
  });
});

describe('diagramDetailsResponseSchema', () => {
  it('should accept a valid diagram details response', () => {
    const timestamp = new Date().toISOString();
    const result = diagramDetailsResponseSchema.safeParse({
      id: randomUUID(),
      name: 'System Architecture',
      folderId: null,
      version: 0,
      snapshot: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a response with an undefined snapshot', () => {
    const timestamp = new Date().toISOString();
    const result = diagramDetailsResponseSchema.safeParse({
      id: randomUUID(),
      name: 'System Architecture',
      folderId: null,
      version: 0,
      snapshot: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });
});
