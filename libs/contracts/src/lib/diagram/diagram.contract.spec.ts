import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  createDiagramSchema,
  diagramParamsSchema,
  diagramSummaryResponseSchema,
  diagramListQuerySchema,
  diagramDetailsResponseSchema,
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
  it('accepts a query without a folder filter', () => {
    const result = diagramListQuerySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts a valid folder id', () => {
    const folderId = randomUUID();

    const result = diagramListQuerySchema.safeParse({
      folderId,
    });

    expect(result.success).toBe(true);
  });

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
