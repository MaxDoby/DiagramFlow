import * as z from 'zod';

const createPasswordSchema = (minimumLength: number) =>
  z
    .string()
    .min(minimumLength)
    .max(72)
    .refine((password) => new TextEncoder().encode(password).length <= 72, {
      message: 'Password must not exceed 72 bytes',
    });

export const loginPasswordSchema = createPasswordSchema(1);
export const strongPasswordSchema = createPasswordSchema(8);
