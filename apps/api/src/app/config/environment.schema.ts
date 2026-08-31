import * as z from 'zod';

export const environmentSchema = z
  .looseObject({
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
    MAIL_PROVIDER: z.enum(['smtp', 'brevo']).default('smtp'),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().max(65535).optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    BREVO_API_KEY: z.string().min(1).optional(),
    MAIL_FROM: z.email(),
    UPLOADS_ROOT: z.string().trim().min(1),
  })
  .superRefine((config, context) => {
    if (config.MAIL_PROVIDER === 'brevo' && !config.BREVO_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['BREVO_API_KEY'],
        message: 'BREVO_API_KEY is required when MAIL_PROVIDER is brevo',
      });
    }

    if (config.MAIL_PROVIDER === 'smtp') {
      if (!config.SMTP_HOST) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_HOST'],
          message: 'SMTP_HOST is required when MAIL_PROVIDER is smtp',
        });
      }

      if (!config.SMTP_PORT) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_PORT'],
          message: 'SMTP_PORT is required when MAIL_PROVIDER is smtp',
        });
      }
    }
  });

export const validateEnvironment = (config: Record<string, unknown>) => {
  return environmentSchema.parse(config);
};
