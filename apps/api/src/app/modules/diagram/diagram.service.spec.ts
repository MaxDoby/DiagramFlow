import { ConflictException, NotFoundException } from '@nestjs/common';
import { type DiagramRepositoryPort } from '@diagram-flow/api-ports';
import { DiagramService } from './diagram.service';
import {
  DiagramFolderNotFoundError,
  DiagramNotFoundError,
  DiagramVersionConflictError,
} from './errors/diagram.error';

describe('DiagramService', () => {
  let service: DiagramService;
  let diagramRepositoryMock: jest.Mocked<DiagramRepositoryPort>;

  beforeEach(() => {
    diagramRepositoryMock = {
      createForOwner: jest.fn(),
      findAllForOwner: jest.fn(),
      findByIdForOwner: jest.fn(),
      findByIdForUser: jest.fn(),
      updateForOwner: jest.fn(),
      saveSnapshotForUser: jest.fn(),
      shareWithUser: jest.fn(),
      findAllSharedWithUser: jest.fn(),
      deleteForOwner: jest.fn(),
    };

    service = new DiagramService(diagramRepositoryMock);
  });

  it('creates a diagram for the authenticated user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-01T10:00:00.000Z');
    const folderId = '33333333-3333-4333-8333-333333333333';

    diagramRepositoryMock.createForOwner.mockResolvedValue({
      id: diagramId,
      name: 'Flow 1',
      folderId,
      version: 0,
      createdAt,
      updatedAt,
    });

    const result = await service.createDiagram(userId, {
      name: 'Flow 1',
      folderId,
    });

    expect(diagramRepositoryMock.createForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      name: 'Flow 1',
      folderId,
    });
    expect(result).toEqual({
      id: diagramId,
      name: 'Flow 1',
      folderId,
      version: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('duplicates a diagram for the authenticated owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const sourceDiagramId = '22222222-2222-4222-8222-222222222222';
    const duplicatedDiagramId = '44444444-4444-4444-8444-444444444444';
    const folderId = '33333333-3333-4333-8333-333333333333';
    const sourceCreatedAt = new Date('2030-01-01T10:00:00.000Z');
    const sourceUpdatedAt = new Date('2030-01-01T11:00:00.000Z');
    const duplicatedAt = new Date('2030-01-01T12:00:00.000Z');
    const snapshot = {
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    };

    diagramRepositoryMock.findByIdForOwner.mockResolvedValue({
      id: sourceDiagramId,
      name: 'Flow 1',
      folderId,
      snapshot,
      version: 3,
      createdAt: sourceCreatedAt,
      updatedAt: sourceUpdatedAt,
    });

    diagramRepositoryMock.createForOwner.mockResolvedValue({
      id: duplicatedDiagramId,
      name: 'Flow 1 copy',
      folderId,
      version: 0,
      createdAt: duplicatedAt,
      updatedAt: duplicatedAt,
    });

    const result = await service.duplicateDiagram(userId, sourceDiagramId);

    expect(diagramRepositoryMock.findByIdForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      diagramId: sourceDiagramId,
    });

    expect(diagramRepositoryMock.createForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      name: 'Flow 1 copy',
      folderId,
      snapshot,
    });

    expect(result).toEqual({
      id: duplicatedDiagramId,
      name: 'Flow 1 copy',
      folderId,
      version: 0,
      createdAt: duplicatedAt.toISOString(),
      updatedAt: duplicatedAt.toISOString(),
    });
  });

  it('throws NotFoundException when duplicating a diagram not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.findByIdForOwner.mockResolvedValue(null);

    await expect(
      service.duplicateDiagram(userId, diagramId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(diagramRepositoryMock.findByIdForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      diagramId,
    });

    expect(diagramRepositoryMock.createForOwner).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the folder is not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '33333333-3333-4333-8333-333333333333';

    diagramRepositoryMock.createForOwner.mockRejectedValue(
      new DiagramFolderNotFoundError(),
    );

    await expect(
      service.createDiagram(userId, {
        name: 'Flow 1',
        folderId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should return a list of existing diagrams', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-01T11:00:00.000Z');

    diagramRepositoryMock.findAllForOwner.mockResolvedValue([
      {
        id: diagramId,
        name: 'Flow 1',
        folderId: null,
        version: 0,
        createdAt,
        updatedAt,
      },
    ]);

    const result = await service.listDiagrams(userId);

    expect(diagramRepositoryMock.findAllForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      folderId: undefined,
    });
    expect(result).toEqual([
      {
        id: diagramId,
        name: 'Flow 1',
        folderId: null,
        version: 0,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
  });

  it('lists diagrams filtered by folder', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '33333333-3333-4333-8333-333333333333';

    diagramRepositoryMock.findAllForOwner.mockResolvedValue([]);

    const result = await service.listDiagrams(userId, folderId);

    expect(diagramRepositoryMock.findAllForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      folderId,
    });
    expect(result).toEqual([]);
  });

  it('returns diagram details for the authenticated owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-01T11:00:00.000Z');
    const snapshot = {};

    diagramRepositoryMock.findByIdForUser.mockResolvedValue({
      id: diagramId,
      name: 'Flow 1',
      folderId: null,
      snapshot,
      version: 0,
      createdAt,
      updatedAt,
    });
    const result = await service.getDiagram(userId, diagramId);

    expect(diagramRepositoryMock.findByIdForUser).toHaveBeenCalledWith({
      userId,
      diagramId,
    });
    expect(result).toEqual({
      id: diagramId,
      name: 'Flow 1',
      folderId: null,
      snapshot: {
        nodes: [],
        edges: [],
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      },
      version: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('throws NotFoundException when the diagram is not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.findByIdForUser.mockResolvedValue(null);

    await expect(service.getDiagram(userId, diagramId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(diagramRepositoryMock.findByIdForUser).toHaveBeenCalledWith({
      userId,
      diagramId,
    });
  });

  it('updates diagram metadata for the authenticated owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-01T12:00:00.000Z');

    diagramRepositoryMock.updateForOwner.mockResolvedValue({
      id: diagramId,
      name: 'Updated Flow',
      folderId: null,
      version: 0,
      createdAt,
      updatedAt,
    });

    const result = await service.updateDiagram(userId, diagramId, {
      name: 'Updated Flow',
      folderId: null,
    });

    expect(diagramRepositoryMock.updateForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      diagramId,
      name: 'Updated Flow',
      folderId: null,
    });

    expect(result).toEqual({
      id: diagramId,
      name: 'Updated Flow',
      folderId: null,
      version: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('throws NotFoundException when the destination folder is not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const folderId = '33333333-3333-4333-8333-333333333333';

    diagramRepositoryMock.updateForOwner.mockRejectedValue(
      new DiagramFolderNotFoundError(),
    );

    await expect(
      service.updateDiagram(userId, diagramId, {
        folderId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when updating a diagram not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.updateForOwner.mockRejectedValue(
      new DiagramNotFoundError(),
    );

    await expect(
      service.updateDiagram(userId, diagramId, {
        name: 'Updated Flow',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('saves a diagram snapshot for the authenticated owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const updatedAt = new Date('2030-01-01T12:00:00.000Z');
    const snapshot = {
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    };

    diagramRepositoryMock.saveSnapshotForUser.mockResolvedValue({
      version: 1,
      updatedAt,
    });

    const result = await service.saveSnapshot(userId, diagramId, {
      snapshot,
      expectedVersion: 0,
    });

    expect(diagramRepositoryMock.saveSnapshotForUser).toHaveBeenCalledWith({
      userId,
      diagramId,
      snapshot,
      expectedVersion: 0,
    });

    expect(result).toEqual({
      version: 1,
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('throws NotFoundException when saving a diagram not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.saveSnapshotForUser.mockRejectedValue(
      new DiagramNotFoundError(),
    );

    await expect(
      service.saveSnapshot(userId, diagramId, {
        snapshot: {
          nodes: [],
          edges: [],
          viewport: {
            x: 0,
            y: 0,
            zoom: 1,
          },
        },
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ConflictException when saving with a stale version', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.saveSnapshotForUser.mockRejectedValue(
      new DiagramVersionConflictError(),
    );

    await expect(
      service.saveSnapshot(userId, diagramId, {
        snapshot: {
          nodes: [],
          edges: [],
          viewport: {
            x: 0,
            y: 0,
            zoom: 1,
          },
        },
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes a diagram owned by the authenticated user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.deleteForOwner.mockResolvedValue(undefined);

    await expect(
      service.deleteDiagram(userId, diagramId),
    ).resolves.toBeUndefined();
    expect(diagramRepositoryMock.deleteForOwner).toHaveBeenCalledWith({
      ownerId: userId,
      diagramId,
    });
  });

  it('throws NotFoundException when deleting a diagram not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    diagramRepositoryMock.deleteForOwner.mockRejectedValue(
      new DiagramNotFoundError(),
    );

    await expect(
      service.deleteDiagram(userId, diagramId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
