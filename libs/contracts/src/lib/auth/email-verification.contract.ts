import * as z from 'zod';

export const confirmEmailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  code: z
    .string()
    .regex(/^\d{6}$/, 'Verification code must contain exactly 6 digits'),
});
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;

export const resendEmailVerificationSchema = confirmEmailSchema.pick({
  email: true,
});
export type ResendEmailVerificationInput = z.infer<
  typeof resendEmailVerificationSchema
>;
