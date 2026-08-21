import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState, type SubmitEvent } from 'react';
import * as z from 'zod';
import { loginSchema } from '@diagram-flow/contracts';
import { LogIn } from 'lucide-react';
import { AuthLayout } from '../components/auth-layout';
import { AuthField } from '../components/auth-field';
import { AuthFormError } from '../components/auth-form-error';
import { AuthSubmitButton } from '../components/auth-submit-button';
import { loginUser } from '../api/login-api';

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export const LoginPage = () => {
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      navigate('/diagrams');
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.reset();
    const formData = new FormData(event.currentTarget);
    const validationResult = loginSchema.safeParse({
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
    loginMutation.mutate(validationResult.data);
  };

  const requestError =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : undefined;

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <>
          No account?{' '}
          <Link
            className="font-medium text-teal-700 hover:underline"
            to="/register"
          >
            Create one
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
          autoComplete="current-password"
          required
          error={fieldErrors.password}
        />
        <AuthFormError message={requestError} />
        <AuthSubmitButton
          icon={LogIn}
          idleLabel="Sign in"
          pendingLabel="Signing in..."
          isPending={loginMutation.isPending}
        />
      </form>
    </AuthLayout>
  );
};
