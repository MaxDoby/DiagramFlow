import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { createDiagramImageFileName } from './diagram-image-file-name';
import { ensureDiagramImageUploadDirectory } from './diagram-image-upload-directory';
import { resolve } from 'node:path';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { normalizeUploadedImage } from '../../../common/uploads/normalize-uploaded-image';
import { diagramImageUrlSchema } from '@diagram-flow/contracts';

@Injectable()
export class DiagramImageStorageService {
  private readonly directory: string;
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.directory = ensureDiagramImageUploadDirectory(configService);
  }

  async save(
    file: Express.Multer.File,
    diagramId: string,
    userId: string,
  ): Promise<string> {
    const image = await normalizeUploadedImage(file.buffer, file.mimetype);
    const fileName = createDiagramImageFileName(image.mimeType);
    const filePath = resolve(this.directory, fileName);
    await writeFile(filePath, image.buffer, { flag: 'wx' });
    try {
      await this.prisma.diagram.update({
        where: {
          id: diagramId,
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
        data: { images: { create: { fileName } } },
        select: { id: true },
      });
    } catch (error) {
      await unlink(filePath);
      throw error;
    }
    return `/uploads/diagram-images/${fileName}`;
  }

  async read(
    userId: string,
    diagramId: string,
    fileName: string,
  ): Promise<StreamableFile> {
    if (
      !diagramImageUrlSchema.safeParse(`/uploads/diagram-images/${fileName}`)
        .success
    ) {
      throw new NotFoundException('Image not found');
    }
    const image = await this.prisma.diagramImage.findFirst({
      where: {
        fileName,
        diagramId,
        diagram: {
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
      },
      select: { fileName: true },
    });
    if (!image) throw new NotFoundException('Image not found');
    try {
      const buffer = await readFile(resolve(this.directory, fileName));
      const type = fileName.endsWith('.jpg')
        ? 'image/jpeg'
        : fileName.endsWith('.png')
          ? 'image/png'
          : 'image/webp';
      return new StreamableFile(buffer, { type, disposition: 'inline' });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new NotFoundException('Image not found');
      }
      throw error;
    }
  }
}
