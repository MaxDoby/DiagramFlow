import * as z from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .max(72)
    .refine((password) => new TextEncoder().encode(password).length <= 72, {
      message: 'Password must not exceed 72 bytes',
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  emailConfirmed: z.boolean(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
