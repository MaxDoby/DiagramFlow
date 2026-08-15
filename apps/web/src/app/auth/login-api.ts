import {
  loginResponseSchema,
  type LoginInput,
  type LoginResponse,
  loginSchema,
  apiErrorResponseSchema,
} from '@diagram-flow/contracts';
import { setAccessToken } from './access-token';

export const loginUser = async (input: LoginInput): Promise<LoginResponse> => {
    const validatedInput = loginSchema.parse(input)
  
    const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
const errorPayload: unknown = await response.json();
const apiError = apiErrorResponseSchema.parse(errorPayload);
throw new Error(apiError.message);
  }

  const payload: unknown = await response.json();
  const result = loginResponseSchema.parse(payload);

  setAccessToken(result.accessToken);

  return result;
};
