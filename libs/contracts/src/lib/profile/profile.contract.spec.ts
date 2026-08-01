import { describe, expect, it } from 'vitest';
import { updateProfileSchema } from './profile.contract';

describe('updateProfileSchema', () => {
  it('trims a valid name', () => {
    const result = updateProfileSchema.parse({
      name: '  Student  ',
    });

    expect(result.name).toBe('Student');
  });

  it('allows removing the name', () => {
    const result = updateProfileSchema.parse({
      name: null,
    });

    expect(result.name).toBeNull();
  });

  it('rejects a name containing only whitespace', () => {
    const result = updateProfileSchema.safeParse({
      name: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      name: 'a'.repeat(101),
    });

    expect(result.success).toBe(false);
  });
});
