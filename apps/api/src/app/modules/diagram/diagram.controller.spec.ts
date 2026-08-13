import { Test } from '@nestjs/testing';
import type { SaveDiagramSnapshotInput } from '@diagram-flow/contracts';
import { DiagramController } from './diagram.controller';
import { DiagramService } from './diagram.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AccessTokenPayload } from '../auth/schemas/access-token-payload.schema';

describe('DiagramController', () => {
  let controller: DiagramController;
  let diagramServiceMock: {
    saveSnapshot: jest.Mock;
  };

  beforeEach(async () => {
    diagramServiceMock = {
      saveSnapshot: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [DiagramController],
      providers: [
        {
          provide: DiagramService,
          useValue: diagramServiceMock,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<DiagramController>(DiagramController);
  });

  it('delegates snapshot saving to the diagram service', async () => {
    const user: AccessTokenPayload = {
      sub: '11111111-1111-4111-8111-111111111111',
      email: 'owner@diagramflow.test',
      iat: 1_893_456_000,
      exp: 1_893_456_900,
    };

    const params = {
      diagramId: '22222222-2222-4222-8222-222222222222',
    };

    const input: SaveDiagramSnapshotInput = {
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
    };

    const serviceResult = {
      version: 1,
      updatedAt: '2030-01-01T12:00:00.000Z',
    };

    diagramServiceMock.saveSnapshot.mockResolvedValue(serviceResult);

    const result = await controller.saveSnapshot(user, params, input);

    expect(diagramServiceMock.saveSnapshot).toHaveBeenCalledWith(
      user.sub,
      params.diagramId,
      input,
    );

    expect(result).toEqual(serviceResult);
  });
});
