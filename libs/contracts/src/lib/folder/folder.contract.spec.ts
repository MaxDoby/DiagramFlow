import { randomUUID } from 'node:crypto';
import {
  createFolderSchema,
  folderParamsSchema,
  folderResponseSchema,
} from './folder.contract';

describe('createFolderSchema', () => {
  it('trims a valid folder name', () => {
    const result = createFolderSchema.parse({
      name: '   Work   ',
    });

    expect(result.name).toBe('Work');
  });

  it('should reject an empty name', () => {
    const result = createFolderSchema.safeParse({
      name: '    ',
    });

    expect(result.success).toBe(false);
  });

  it('should reject an invalid folder name bigger than 100 char', () => {
    const result = createFolderSchema.safeParse({
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('folderParamsSchema', () => {
  it('rejects an invalid folder id', () => {
    const result = folderParamsSchema.safeParse({
      folderId: 'invalid-id',
    });

    expect(result.success).toBe(false);
  });
});

describe('folderResponseSchema', () => {
  it('accepts a folder containing zero diagrams', () => {
    const timestamp = new Date().toISOString();

    const result = folderResponseSchema.safeParse({
      id: randomUUID(),
      name: 'Empty folder',
      diagramCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(true);
  });
});
