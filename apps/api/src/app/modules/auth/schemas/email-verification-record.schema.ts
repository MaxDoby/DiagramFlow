import * as z from 'zod';

export const emailVerificationRecordSchema = z.object({
  codeHash: z.string().regex(/^[a-f0-9]{64}$/),
  attemptsRemaining: z.number().int().positive(),
});

export type EmailVerificationRecord = z.infer<
  typeof emailVerificationRecordSchema
>;
