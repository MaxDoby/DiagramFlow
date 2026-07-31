import * as z from 'zod';

export const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;
