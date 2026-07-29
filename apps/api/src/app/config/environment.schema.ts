import * as z from 'zod';

export const environmentSchema = z.looseObject({
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(43),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive(),
});

export const validateEnvironment = (config: Record<string, unknown>) => {
  return environmentSchema.parse(config);
};
