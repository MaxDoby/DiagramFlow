import { describe, expect, it } from 'vitest';
import { changePasswordSchema } from './change-password.contract';

describe('changePasswordSchema', () => {
  it('accepts a valid password change', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewPassword456!',
      confirmNewPassword: 'NewPassword456!',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a mismatched password confirmation', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewPassword456!',
      confirmNewPassword: 'DifferentPassword789!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects reusing the current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'CurrentPassword123!',
      confirmNewPassword: 'CurrentPassword123!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a weak new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'short',
      confirmNewPassword: 'short',
    });

    expect(result.success).toBe(false);
  });
});
