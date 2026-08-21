import {
  loginResponseSchema,
  type LoginInput,
  type LoginResponse,
  loginSchema,
} from '@diagram-flow/contracts';
import { setAccessToken } from '../../../shared/api/access-token';
import { throwApiError } from '../../../shared/api/throw-api-error';

export const loginUser = async (input: LoginInput): Promise<LoginResponse> => {
  const validatedInput = loginSchema.parse(input);

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();
  const result = loginResponseSchema.parse(payload);

  setAccessToken(result.accessToken);

  return result;
};
