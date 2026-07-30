import { describe, expect, it } from 'vitest';
import {
  confirmEmailSchema,
  resendEmailVerificationSchema,
} from './email-verification.contract';

describe('confirmEmailSchema', () => {
  it('accepts a valid verification code and normalizes the email', () => {
    const input = {
      email: 'UseR@example.com',
      code: '012345',
    };

    const result = confirmEmailSchema.parse(input);

    expect(result.email).toBe('user@example.com');
    expect(result.code).toBe('012345');
  });

  it.each(['12345', '1234567', '12A456'])(
    'rejects invalid verification code: %s',
    (code) => {
      const input = {
        email: 'user@example.com',
        code,
      };

      const result = confirmEmailSchema.safeParse(input);

      expect(result.success).toBe(false);
    },
  );
});

describe('resendEmailVerificationSchema', () => {
  it('normalizes a valid email', () => {
    const input = {
      email: 'USER@example.com',
    };

    const result = resendEmailVerificationSchema.parse(input);

    expect(result.email).toBe('user@example.com');
  });
});
