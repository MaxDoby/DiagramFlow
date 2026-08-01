import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.contract';

describe('loginSchema', () => {
  it('normalizes a valid email', () => {
    const input = {
      email: 'USER@example.com  ',
      password: 'Securepass2026',
    };

    const result = loginSchema.parse(input);

    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe(input.password);
  });

  it('rejects an empty password', () => {
    const input = {
      email: 'user@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 72 bytes', () => {
    const input = {
      email: 'user@example.com',
      password: '🔐'.repeat(20),
    };

    const passwordBytes = new TextEncoder().encode(input.password);
    const result = loginSchema.safeParse(input);

    expect(passwordBytes).toHaveLength(80);
    expect(result.success).toBe(false);
  });
});
