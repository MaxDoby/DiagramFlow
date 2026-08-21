import type { ComponentPropsWithoutRef } from 'react';

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
