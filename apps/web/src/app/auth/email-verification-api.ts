import {
  confirmEmailSchema,
  resendEmailVerificationSchema,
  type ConfirmEmailInput,
  type ResendEmailVerificationInput,
} from '@diagram-flow/contracts';
import { throwApiError } from '../api/throw-api-error';

export const confirmEmail = async (input: ConfirmEmailInput): Promise<void> => {
  const validatedInput = confirmEmailSchema.parse(input);

  const response = await fetch('/api/auth/confirm-email', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }
};

export const resendVerificationCode = async (
  input: ResendEmailVerificationInput,
): Promise<void> => {
  const validatedInput = resendEmailVerificationSchema.parse(input);

  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }
};
