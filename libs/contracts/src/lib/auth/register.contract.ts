import * as z from 'zod';
import { strongPasswordSchema } from '../common/password.schema';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: strongPasswordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  emailConfirmed: z.boolean(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
