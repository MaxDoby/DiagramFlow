import {
  registerResponseSchema,
  registerSchema,
  type RegisterInput,
  type RegisterResponse,
} from '@diagram-flow/contracts';
import { throwApiError } from '../../../shared/api/throw-api-error';

export const registerUser = async (
  input: RegisterInput,
): Promise<RegisterResponse> => {
  const validatedInput = registerSchema.parse(input);

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return registerResponseSchema.parse(payload);
};
