import { useState, type SubmitEvent } from 'react';
import { changePasswordSchema } from '@diagram-flow/contracts';
import { LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

import { useChangePasswordMutation } from '../queries/profile-queries';

type PasswordFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

type PasswordFieldName = keyof PasswordFieldErrors;

type PasswordFieldProps = {
  id: string;
  label: string;
  name: PasswordFieldName;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  onChange: () => void;
};

const inputClassName = [
  'h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none',
  'focus:border-teal-700 focus:ring-2 focus:ring-teal-100',
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-100',
].join(' ');

const PasswordField = ({
  id,
  label,
  name,
  autoComplete,
  error,
  onChange,
}: PasswordFieldProps) => {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        className={inputClassName}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        onChange={onChange}
      />

      <p
        id={errorId}
        className="min-h-5 text-sm text-red-600"
        aria-live="polite"
      >
        {error}
      </p>
    </div>
  );
};

export const ChangePasswordForm = () => {
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});
  const changePasswordMutation = useChangePasswordMutation();
  const navigate = useNavigate();

  const clearFieldError = (field: PasswordFieldName) => {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    changePasswordMutation.reset();

    const formData = new FormData(event.currentTarget);
    const validationResult = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmNewPassword: formData.get('confirmNewPassword'),
    });

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;

      setFieldErrors({
        currentPassword: errors.currentPassword?.[0],
        newPassword: errors.newPassword?.[0],
        confirmNewPassword: errors.confirmNewPassword?.[0],
      });
      return;
    }

    setFieldErrors({});

    changePasswordMutation.mutate(validationResult.data, {
      onSuccess: () => {
        navigate('/login', { replace: true });
      },
    });
  };

  const requestError =
    changePasswordMutation.error instanceof Error
      ? changePasswordMutation.error.message
      : undefined;

  return (
    <section aria-labelledby="change-password-title">
      <h2 id="change-password-title" className="text-lg font-semibold">
        Change password
      </h2>

      <form
        className="mt-5 max-w-md space-y-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <PasswordField
          id="current-password"
          label="Current password"
          name="currentPassword"
          autoComplete="current-password"
          error={fieldErrors.currentPassword}
          onChange={() => clearFieldError('currentPassword')}
        />

        <PasswordField
          id="new-password"
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          error={fieldErrors.newPassword}
          onChange={() => clearFieldError('newPassword')}
        />

        <PasswordField
          id="confirm-new-password"
          label="Confirm new password"
          name="confirmNewPassword"
          autoComplete="new-password"
          error={fieldErrors.confirmNewPassword}
          onChange={() => clearFieldError('confirmNewPassword')}
        />

        {requestError && (
          <p className="text-sm text-red-600" role="alert">
            {requestError}
          </p>
        )}

        <button
          className="flex h-10 items-center justify-center gap-2
            rounded-md bg-zinc-900 px-4 text-sm font-medium text-white
            hover:bg-zinc-800 disabled:cursor-not-allowed
            disabled:opacity-60"
          type="submit"
          disabled={changePasswordMutation.isPending}
        >
          <LockKeyhole aria-hidden="true" size={16} />
          {changePasswordMutation.isPending
            ? 'Changing password...'
            : 'Change password'}
        </button>
      </form>
    </section>
  );
};
