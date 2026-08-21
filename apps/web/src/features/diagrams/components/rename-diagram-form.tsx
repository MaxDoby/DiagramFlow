import {
  updateDiagramSchema,
  type DiagramSummaryResponse,
} from '@diagram-flow/contracts';
import { useState, type SubmitEvent } from 'react';
import * as z from 'zod';

import { useRenameDiagramMutation } from '../queries/diagram-queries';

type RenameDiagramFormProps = {
  diagram: DiagramSummaryResponse;
  onCancel: () => void;
  onRenamed: () => void;
};

export const RenameDiagramForm = ({
  diagram,
  onCancel,
  onRenamed,
}: RenameDiagramFormProps) => {
  const [nameError, setNameError] = useState<string>();
  const renameMutation = useRenameDiagramMutation(diagram.id);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    renameMutation.reset();

    const formData = new FormData(event.currentTarget);
    const validationResult = updateDiagramSchema.safeParse({
      name: formData.get('name'),
    });

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;
      setNameError(errors.name?.[0]);
      return;
    }

    setNameError(undefined);
    renameMutation.mutate(validationResult.data, { onSuccess: onRenamed });
  };

  const handleCancel = () => {
    renameMutation.reset();
    setNameError(undefined);
    onCancel();
  };

  const requestError =
    renameMutation.error instanceof Error
      ? renameMutation.error.message
      : undefined;

  return (
    <li className="px-4 py-3">
      <form onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor={`diagram-name-${diagram.id}`}>
          Diagram name
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 aria-[invalid=true]:border-red-500"
            id={`diagram-name-${diagram.id}`}
            name="name"
            type="text"
            defaultValue={diagram.name}
            maxLength={150}
            autoFocus
            required
            aria-invalid={Boolean(nameError)}
            aria-describedby={`diagram-name-error-${diagram.id}`}
          />

          <button
            className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100"
            type="button"
            onClick={handleCancel}
            disabled={renameMutation.isPending}
          >
            Cancel
          </button>

          <button
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            type="submit"
            disabled={renameMutation.isPending}
          >
            {renameMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>

        <p
          id={`diagram-name-error-${diagram.id}`}
          className="mt-2 min-h-5 text-sm text-red-600"
          aria-live="polite"
        >
          {nameError ?? requestError}
        </p>
      </form>
    </li>
  );
};
