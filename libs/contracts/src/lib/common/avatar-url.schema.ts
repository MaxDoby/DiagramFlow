import * as z from 'zod';

const localAvatarUrlSchema = z
  .string()
  .regex(
    /^\/uploads\/avatars\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/,
    'Invalid local avatar URL',
  );

export const avatarUrlSchema = z.union([z.url(), localAvatarUrlSchema]);
