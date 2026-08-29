import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import {
  DIAGRAM_IMAGE_EXTENSION_BY_MIME_TYPE,
  isAllowedDiagramImageMimeType,
} from './diagram-image-upload.constants';

export const createDiagramImageFileName = (mimeType: string): string => {
  if (!isAllowedDiagramImageMimeType(mimeType)) {
    throw new BadRequestException('Unsupported diagram image file type');
  }

  const extension = DIAGRAM_IMAGE_EXTENSION_BY_MIME_TYPE[mimeType];

  return `${randomUUID()}.${extension}`;
};
