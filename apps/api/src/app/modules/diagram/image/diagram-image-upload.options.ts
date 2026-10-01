import { BadRequestException } from '@nestjs/common';
import type { MulterModuleOptions } from '@nestjs/platform-express';
import {
  DIAGRAM_IMAGE_MAX_FILE_SIZE_BYTES,
  isAllowedDiagramImageMimeType,
} from './diagram-image-upload.constants';

export const createDiagramImageUploadOptions = (): MulterModuleOptions => ({
  limits: {
    fileSize: DIAGRAM_IMAGE_MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedDiagramImageMimeType(file.mimetype)) {
      callback(
        new BadRequestException('Unsupported diagram image file type'),
        false,
      );
      return;
    }
    callback(null, true);
  },
});
