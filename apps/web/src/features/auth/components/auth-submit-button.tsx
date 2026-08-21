import { LoaderCircle, type LucideIcon } from 'lucide-react';

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
