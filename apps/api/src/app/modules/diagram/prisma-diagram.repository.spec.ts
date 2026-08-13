import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PrismaDiagramRepository } from './prisma-diagram.repository';
import { Prisma } from '../../../generated/prisma/client';
import {
  DiagramNotFoundError,
  DiagramVersionConflictError,
} from './errors/diagram.error';

type PrismaServiceMock = {
  diagram: {
    update: jest.Mock;
    findUnique: jest.Mock;
  };
};

describe('PrismaDiagramRepository', () => {
  let repository: PrismaDiagramRepository;
  let prismaServiceMock: PrismaServiceMock;

  beforeEach(() => {
    prismaServiceMock = {
      diagram: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    repository = new PrismaDiagramRepository(
      prismaServiceMock as unknown as PrismaService,
    );
  });

  it('saves a snapshot and increments its version atomically', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';
    const updatedAt = new Date('2030-01-01T11:00:00.000Z');
    const snapshot = {
      nodes: [],
      edges: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    };

    prismaServiceMock.diagram.update.mockResolvedValue({
      version: 1,
      updatedAt,
    });

    const result = await repository.saveSnapshotForOwner({
      ownerId,
      diagramId,
      snapshot,
      expectedVersion: 0,
    });

    expect(prismaServiceMock.diagram.update).toHaveBeenCalledWith({
      where: {
        id: diagramId,
        ownerId,
        version: 0,
      },
      data: {
        snapshot,
        version: {
          increment: 1,
        },
      },
      select: {
        version: true,
        updatedAt: true,
      },
    });

    expect(result).toEqual({
      version: 1,
      updatedAt,
    });
  });

  it('throws DiagramNotFoundError when the diagram does not exist for the owner', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    prismaServiceMock.diagram.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.9.0',
      }),
    );

    prismaServiceMock.diagram.findUnique.mockResolvedValue(null);

    await expect(
      repository.saveSnapshotForOwner({
        ownerId,
        diagramId,
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
    ).rejects.toBeInstanceOf(DiagramNotFoundError);

    expect(prismaServiceMock.diagram.findUnique).toHaveBeenCalledWith({
      where: {
        id: diagramId,
        ownerId,
      },
      select: {
        id: true,
      },
    });
  });

  it('throws DiagramVersionConflictError when the expected version is stale', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const diagramId = '22222222-2222-4222-8222-222222222222';

    prismaServiceMock.diagram.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.9.0',
      }),
    );

    prismaServiceMock.diagram.findUnique.mockResolvedValue({
      id: diagramId,
    });

    await expect(
      repository.saveSnapshotForOwner({
        ownerId,
        diagramId,
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
    ).rejects.toBeInstanceOf(DiagramVersionConflictError);
  });
});
