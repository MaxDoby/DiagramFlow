import * as z from 'zod';
import {
  loginPasswordSchema,
  strongPasswordSchema,
} from '../common/password.schema';

export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordSchema,
    newPassword: strongPasswordSchema,
    confirmNewPassword: strongPasswordSchema,
  })
  .refine((input) => input.newPassword === input.confirmNewPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmNewPassword'],
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
