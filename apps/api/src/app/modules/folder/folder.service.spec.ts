import { NotFoundException, ConflictException } from '@nestjs/common';
import {
  FolderNameAlreadyExistsError,
  FolderNotFoundError,
} from './errors/folder.error';
import { FolderRepository } from './folder.repository';
import { FolderService } from './folder.service';

describe('FolderService', () => {
  let service: FolderService;

  let folderRepositoryMock: {
    createForOwner: jest.Mock;
    findAllForOwner: jest.Mock;
    renameOwnedFolder: jest.Mock;
    deleteOwnedFolder: jest.Mock;
  };

  beforeEach(() => {
    folderRepositoryMock = {
      createForOwner: jest.fn(),
      findAllForOwner: jest.fn(),
      renameOwnedFolder: jest.fn(),
      deleteOwnedFolder: jest.fn(),
    };

    service = new FolderService(
      folderRepositoryMock as unknown as FolderRepository,
    );
  });

  it('creates a folder for the authenticated user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-01T10:00:00.000Z');

    folderRepositoryMock.createForOwner.mockResolvedValue({
      id: folderId,
      name: 'Work',
      diagramCount: 0,
      createdAt,
      updatedAt,
    });

    const result = await service.createFolder(userId, {
      name: 'Work',
    });

    expect(folderRepositoryMock.createForOwner).toHaveBeenCalledWith(
      userId,
      'Work',
    );
    expect(result).toEqual({
      id: folderId,
      name: 'Work',
      diagramCount: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('throws ConflictException when the folder name already exists', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    folderRepositoryMock.createForOwner.mockRejectedValue(
      new FolderNameAlreadyExistsError(),
    );

    await expect(
      service.createFolder(userId, {
        name: 'Work',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the authenticated user folders', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-02T10:00:00.000Z');

    folderRepositoryMock.findAllForOwner.mockResolvedValue([
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Work',
        diagramCount: 2,
        createdAt,
        updatedAt,
      },
    ]);

    const result = await service.listFolders(userId);

    expect(folderRepositoryMock.findAllForOwner).toHaveBeenCalledWith(userId);

    expect(result).toEqual([
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Work',
        diagramCount: 2,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
  });

  it('renames a folder owned by the authenticated user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2030-01-01T10:00:00.000Z');
    const updatedAt = new Date('2030-01-02T10:00:00.000Z');

    folderRepositoryMock.renameOwnedFolder.mockResolvedValue({
      id: folderId,
      name: 'Renamed',
      diagramCount: 2,
      createdAt,
      updatedAt,
    });

    const result = await service.renameFolder(userId, folderId, {
      name: 'Renamed',
    });

    expect(folderRepositoryMock.renameOwnedFolder).toHaveBeenCalledWith(
      userId,
      folderId,
      'Renamed',
    );

    expect(result).toEqual({
      id: folderId,
      name: 'Renamed',
      diagramCount: 2,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('throws ConflictException when the renamed folder name already exists', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '22222222-2222-4222-8222-222222222222';

    folderRepositoryMock.renameOwnedFolder.mockRejectedValue(
      new FolderNameAlreadyExistsError(),
    );

    await expect(
      service.renameFolder(userId, folderId, {
        name: 'Existing',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when the folder is not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '22222222-2222-4222-8222-222222222222';

    folderRepositoryMock.renameOwnedFolder.mockRejectedValue(
      new FolderNotFoundError(),
    );

    await expect(
      service.renameFolder(userId, folderId, {
        name: 'Renamed',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a folder owned by the authenticated user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '22222222-2222-4222-8222-222222222222';

    folderRepositoryMock.deleteOwnedFolder.mockResolvedValue(undefined);

    await service.deleteFolder(userId, folderId);

    expect(folderRepositoryMock.deleteOwnedFolder).toHaveBeenCalledWith(
      userId,
      folderId,
    );
  });

  it('throws NotFoundException when deleting a folder not owned by the user', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const folderId = '22222222-2222-4222-8222-222222222222';

    folderRepositoryMock.deleteOwnedFolder.mockRejectedValue(
      new FolderNotFoundError(),
    );

    await expect(service.deleteFolder(userId, folderId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
