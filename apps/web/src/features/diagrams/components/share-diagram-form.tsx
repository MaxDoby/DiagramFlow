import { type SubmitEvent, useId, useState } from 'react';
import { Mail, X } from 'lucide-react';

import { useShareDiagramMutation } from '../queries/diagram-queries';

type ShareDiagramFormProps = {
  diagramId: string;
  onCancel: () => void;
};

export const ShareDiagramForm = ({
  diagramId,
  onCancel,
}: ShareDiagramFormProps) => {
  const emailInputId = useId();
  const [email, setEmail] = useState('');
  const shareMutation = useShareDiagramMutation(diagramId);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    shareMutation.mutate(
      { email },
      {
        onSuccess: () => setEmail(''),
      },
    );
  };

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3 border-t border-zinc-200 pt-3"
      onSubmit={handleSubmit}
    >
      <div className="min-w-60 flex-1">
        <label
          className="mb-1 block text-sm font-medium text-zinc-700"
          htmlFor={emailInputId}
        >
          Collaborator email
        </label>

        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2
              size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />

          <input
            id={emailInputId}
            className="h-10 w-full rounded-md border border-zinc-300
              bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            type="email"
            value={email}
            required
            autoComplete="email"
            placeholder="name@example.com"
            onChange={(event) => {
              setEmail(event.target.value);
              shareMutation.reset();
            }}
          />
        </div>
      </div>

      <button
        className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={shareMutation.isPending}
      >
        {shareMutation.isPending ? 'Sharing...' : 'Share'}
      </button>

      <button
        className="flex size-10 items-center justify-center rounded-md border border-zinc-300 hover:bg-zinc-100"
        type="button"
        title="Cancel sharing"
        aria-label="Cancel sharing"
        onClick={onCancel}
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      {shareMutation.isError && (
        <p className="basis-full text-sm text-red-700" role="alert">
          {shareMutation.error.message}
        </p>
      )}

      {shareMutation.isSuccess && (
        <p className="basis-full text-sm text-emerald-700" role="status">
          Diagram shared successfully.
        </p>
      )}
    </form>
  );
};
