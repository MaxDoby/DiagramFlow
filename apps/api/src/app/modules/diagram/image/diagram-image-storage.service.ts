import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile } from 'node:fs/promises';
import { createDiagramImageFileName } from './diagram-image-file-name';
import { ensureDiagramImageUploadDirectory } from './diagram-image-upload-directory';
import { resolve } from 'node:path';

@Injectable()
export class DiagramImageStorageService {
  private readonly directory: string;

  constructor(configService: ConfigService) {
    this.directory = ensureDiagramImageUploadDirectory(configService);
  }

  async save(file: Express.Multer.File): Promise<string> {
    const fileName = createDiagramImageFileName(file.mimetype);
    const filePath = resolve(this.directory, fileName);

    await writeFile(filePath, file.buffer, { flag: 'wx' });

    return `/uploads/diagram-images/${fileName}`;
  }
}
