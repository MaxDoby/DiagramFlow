import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from './login-api';
import { useState, type SubmitEvent } from 'react';
import * as z from 'zod';
import { loginSchema } from '@diagram-flow/contracts';
import { Workflow, LoaderCircle, LogIn } from 'lucide-react';

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

const inputClassName =
  'h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition-colors focus:border-teal-700 focus:ring-2 focus:ring-teal-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-100';

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
    <main className="min-h-screen bg-zinc-50 px-5 py-10 text-zinc-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center">
        <header className="mb-8">
          <div className="mb-8 flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center
      rounded-md bg-teal-700 text-white"
            >
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold">DiagramFlow</span>
          </div>

          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-600">Welcome back.</p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>

            <input
              className={inputClassName}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby="email-error"
            />

            <p
              id="email-error"
              className="min-h-5 text-sm text-red-600"
              aria-live="polite"
            >
              {fieldErrors.email}
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>

            <input
              className={inputClassName}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="password-error"
            />

            <p
              id="password-error"
              className="min-h-5 text-sm text-red-600"
              aria-live="polite"
            >
              {fieldErrors.password}
            </p>
          </div>

          {requestError && (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2
      text-sm text-red-700"
              role="alert"
            >
              {requestError}
            </p>
          )}

          <button
            className="flex h-11 w-full items-center justify-center gap-2
    rounded-md bg-zinc-900 px-4 text-sm font-medium text-white
    transition-colors hover:bg-zinc-800 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed
    disabled:opacity-60"
            type="submit"
            disabled={loginMutation.isPending}
            aria-busy={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LogIn className="size-4" aria-hidden="true" />
            )}

            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          No account?{' '}
          <Link
            className="font-medium text-teal-700 hover:underline"
            to="/register"
          >
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
};
