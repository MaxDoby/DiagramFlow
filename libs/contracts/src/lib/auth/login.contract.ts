import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((password) => new TextEncoder().encode(password).length <= 72, {
      message: 'Password must not exceed 72 bytes',
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.jwt(),
  accessTokenExpiresInSeconds: z.number().int().positive(),
  user: z.object({
    id: z.uuid(),
    email: z.email(),
    name: z.string().nullable(),
    avatarUrl: z.url().nullable(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
