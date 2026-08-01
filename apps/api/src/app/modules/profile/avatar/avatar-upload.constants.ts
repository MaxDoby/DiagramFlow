export const AVATAR_EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const AVATAR_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export type AvatarMimeType = keyof typeof AVATAR_EXTENSION_BY_MIME_TYPE;

export const isAllowedAvatarMimeType = (
  mimeType: string,
): mimeType is AvatarMimeType => {
  return mimeType in AVATAR_EXTENSION_BY_MIME_TYPE;
};
