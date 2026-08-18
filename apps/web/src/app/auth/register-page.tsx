import { useState, type SubmitEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registerSchema } from '@diagram-flow/contracts';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import * as z from 'zod';
import { AuthLayout } from './auth-layout';
import {
  AuthField,
  AuthFormError,
  AuthSubmitButton,
} from './auth-form-controls';
import { registerUser } from './register-api';

type RegisterFieldErrors = {
  email?: string;
  password?: string;
};

export const RegisterPage = () => {
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (result) => {
      navigate('/confirm-email', {
        state: { email: result.email },
      });
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    registerMutation.reset();

    const formData = new FormData(event.currentTarget);
    const validationResult = registerSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    registerMutation.mutate(validationResult.data);
  };

  const requestError =
    registerMutation.error instanceof Error
      ? registerMutation.error.message
      : undefined;

  return (
    <AuthLayout
      title="Create account"
      footer={
        <>
          Already registered?{' '}
          <Link
            className="font-medium text-teal-700 hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldErrors.email}
        />
        <AuthField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          error={fieldErrors.password}
        />
        <AuthFormError message={requestError} />
        <AuthSubmitButton
          icon={UserPlus}
          idleLabel="Create account"
          pendingLabel="Creating account..."
          isPending={registerMutation.isPending}
        />
      </form>
    </AuthLayout>
  );
};
