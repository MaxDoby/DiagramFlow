import * as z from 'zod';

export const environmentSchema = z.looseObject({
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(43),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive(),
  EMAIL_VERIFICATION_OTP_SECRET: z.string().min(43),
  EMAIL_VERIFICATION_OTP_TTL_SECONDS: z.coerce.number().int().positive(),
  EMAIL_VERIFICATION_MAX_ATTEMPTS: z.coerce.number().int().positive(),
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: z.coerce
    .number()
    .int()
    .positive(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().max(65535),
  MAIL_FROM: z.email(),
  UPLOADS_ROOT: z.string().trim().min(1),
});

export const validateEnvironment = (config: Record<string, unknown>) => {
  return environmentSchema.parse(config);
};
