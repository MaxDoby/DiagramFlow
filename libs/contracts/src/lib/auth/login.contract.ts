import * as z from 'zod';
import { loginPasswordSchema } from '../common/password.schema';
import { avatarUrlSchema } from '../common/avatar-url.schema';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: loginPasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.jwt(),
  accessTokenExpiresInSeconds: z.number().int().positive(),
  user: z.object({
    id: z.uuid(),
    email: z.email(),
    name: z.string().nullable(),
    avatarUrl: avatarUrlSchema.nullable(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
