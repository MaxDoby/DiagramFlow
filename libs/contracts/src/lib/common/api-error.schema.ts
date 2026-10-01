import * as z from 'zod';

export const apiErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string().optional(),
});