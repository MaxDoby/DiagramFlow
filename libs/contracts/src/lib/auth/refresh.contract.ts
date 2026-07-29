import * as z from 'zod';

export const refreshResponseSchema = z.object({
  accessToken: z.jwt(),
  accessTokenExpiresInSeconds: z.number().int().positive(),
});

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
