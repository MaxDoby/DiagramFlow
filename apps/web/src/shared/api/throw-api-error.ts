import { apiErrorResponseSchema } from '@diagram-flow/contracts';

export const throwApiError = async (response: Response): Promise<never> => {
  const payload: unknown = await response.json();
  const apiError = apiErrorResponseSchema.parse(payload);

  throw new Error(apiError.message);
};
