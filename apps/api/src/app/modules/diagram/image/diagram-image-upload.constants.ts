export const DIAGRAM_IMAGE_EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const DIAGRAM_IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export type DiagramImageMimeType =
  keyof typeof DIAGRAM_IMAGE_EXTENSION_BY_MIME_TYPE;

export const isAllowedDiagramImageMimeType = (
  mimeType: string,
): mimeType is DiagramImageMimeType =>
  Object.prototype.hasOwnProperty.call(
    DIAGRAM_IMAGE_EXTENSION_BY_MIME_TYPE,
    mimeType,
  );
