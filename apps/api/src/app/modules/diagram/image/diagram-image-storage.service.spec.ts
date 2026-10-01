import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DiagramImageStorageService } from './diagram-image-storage.service';

it('requires diagram access before reading an image and rejects traversal', async () => {
  const root = await mkdtemp(join(tmpdir(), 'diagramflow-images-'));
  const findFirst = jest.fn();
  const fileName = '22222222-2222-4222-8222-222222222222.png';
  const userId = '11111111-1111-4111-8111-111111111111';
  const diagramId = '22222222-2222-4222-8222-222222222222';
  try {
    const service = new DiagramImageStorageService(
      new ConfigService({ UPLOADS_ROOT: root }),
      { diagramImage: { findFirst } } as unknown as PrismaService,
    );
    await writeFile(
      join(root, 'diagram-images', fileName),
      Buffer.from('image'),
    );
    findFirst.mockResolvedValue(null);
    await expect(
      service.read(userId, diagramId, fileName),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        fileName,
        diagramId,
        diagram: {
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
      },
      select: { fileName: true },
    });
    findFirst.mockResolvedValue({ fileName });
    expect(
      (await service.read(userId, diagramId, fileName)).getHeaders().type,
    ).toBe('image/png');
    await expect(
      service.read(userId, diagramId, '../private'),
    ).rejects.toBeInstanceOf(NotFoundException);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
