import type { ComponentPropsWithoutRef } from 'react';
import { LoaderCircle, type LucideIcon } from 'lucide-react';

type AuthFieldProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'aria-describedby' | 'aria-invalid' | 'id'
> & {
  id: string;
  label: string;
  error?: string;
};

const inputClassName = [
  'h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none',
  'focus:border-teal-700 focus:ring-2 focus:ring-teal-100',
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-100',
].join(' ');

export const AuthField = ({
  id,
  label,
  error,
  ...inputProps
}: AuthFieldProps) => {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        className={inputClassName}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
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

type AuthFormErrorProps = {
  message?: string;
};

export const AuthFormError = ({ message }: AuthFormErrorProps) =>
  message ? (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {message}
    </p>
  ) : null;

type AuthSubmitButtonProps = {
  icon: LucideIcon;
  idleLabel: string;
  pendingLabel: string;
  isPending: boolean;
};

export const AuthSubmitButton = ({
  icon: Icon,
  idleLabel,
  pendingLabel,
  isPending,
}: AuthSubmitButtonProps) => (
  <button
    className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    type="submit"
    disabled={isPending}
    aria-busy={isPending}
  >
    {isPending ? (
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
    ) : (
      <Icon className="size-4" aria-hidden="true" />
    )}
    {isPending ? pendingLabel : idleLabel}
  </button>
);
