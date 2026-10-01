import { useState, type SubmitEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { confirmEmailSchema } from '@diagram-flow/contracts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import * as z from 'zod';
import { AuthLayout } from '../components/auth-layout';
import { AuthField } from '../components/auth-field';
import { AuthFormError } from '../components/auth-form-error';
import { AuthSubmitButton } from '../components/auth-submit-button';
import { confirmEmail } from '../api/email-verification-api';

type ConfirmationFieldErrors = {
  email?: string;
  code?: string;
};

const registrationStateSchema = z.object({
  email: z.email(),
});

export const ConfirmEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateResult = registrationStateSchema.safeParse(location.state);
  const initialEmail = stateResult.success ? stateResult.data.email : '';

  const [fieldErrors, setFieldErrors] = useState<ConfirmationFieldErrors>({});

  const confirmationMutation = useMutation({
    mutationFn: confirmEmail,
    onSuccess: () => {
      navigate('/login', { replace: true });
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirmationMutation.reset();

    const formData = new FormData(event.currentTarget);
    const validationResult = confirmEmailSchema.safeParse({
      email: formData.get('email'),
      code: formData.get('code'),
    });

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;

      setFieldErrors({
        email: errors.email?.[0],
        code: errors.code?.[0],
      });
      return;
    }

    setFieldErrors({});
    confirmationMutation.mutate(validationResult.data);
  };

  const requestError =
    confirmationMutation.error instanceof Error
      ? confirmationMutation.error.message
      : undefined;

  return (
    <AuthLayout
      title="Confirm email"
      footer={
        <Link className="font-medium text-teal-700 hover:underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={initialEmail}
          required
          error={fieldErrors.email}
        />
        <AuthField
          id="code"
          label="Verification code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          error={fieldErrors.code}
        />
        <AuthFormError message={requestError} />
        <AuthSubmitButton
          icon={MailCheck}
          idleLabel="Confirm email"
          pendingLabel="Confirming..."
          isPending={confirmationMutation.isPending}
        />
      </form>
    </AuthLayout>
  );
};
