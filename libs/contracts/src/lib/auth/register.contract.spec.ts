import { describe, expect, it } from 'vitest';
import { registerSchema } from './register.contract';

describe('registerSchema', () => {
  it('normalizes a valid email', () => {
    const input = {
      email: 'USER@Example.com  ',
      password: 'SecurePassword2026',
    };

    const result = registerSchema.parse(input);

    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe(input.password);
  });

  it('rejects an invalid email', () => {
    const input = {
      email: 'invalid-email',
      password: 'SecurePasswrod2026',
    };

    const result = registerSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const input = {
      email: 'user@example.com',
      password: 'short',
    };

    const result = registerSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 72 bytes', () => {
    const input = {
      email: 'user@example.com',
      password: '🔐'.repeat(20),
    };

    const passwordBytes = new TextEncoder().encode(input.password);
    const result = registerSchema.safeParse(input);

    expect(passwordBytes).toHaveLength(80);
    expect(result.success).toBe(false);
  });
});
