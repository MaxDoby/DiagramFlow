import { describe, expect, it } from 'vitest';
import { refreshResponseSchema } from './refresh.contract';

describe('refreshResponseSchema', () => {
  it('accepts a valid refresh response', () => {
    const input = {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQifQ.dGVzdC1zaWduYXR1cmU',
      accessTokenExpiresInSeconds: 900,
    };

    const result = refreshResponseSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid access token', () => {
    const input = {
      accessToken: 'not-a-jwt',
      accessTokenExpiresInSeconds: 900,
    };

    const result = refreshResponseSchema.safeParse(input);

    expect(result.success).toBe(false);
  });
});
