import * as z from 'zod';
import { avatarUrlSchema } from '../common/avatar-url.schema';

export const profileResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().max(100).nullable(),
  avatarUrl: avatarUrlSchema.nullable(),
  emailConfirmed: z.boolean(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
