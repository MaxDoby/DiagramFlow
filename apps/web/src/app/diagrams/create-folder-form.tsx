import { useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFolderSchema,
  type FolderResponse,
} from '@diagram-flow/contracts';
import { FolderPlus, LoaderCircle } from 'lucide-react';
import * as z from 'zod';
import { createFolder } from './folder-api';

type CreateFolderFormProps = {
  onCreated: (folder: FolderResponse) => void;
  onCancel: () => void;
};

export const CreateFolderForm = ({
  onCreated,
  onCancel,
}: CreateFolderFormProps) => {
  const [nameError, setNameError] = useState<string>();
  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: async (folder) => {
      await queryClient.invalidateQueries({
        queryKey: ['folders'],
      });

      onCreated(folder);
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    createFolderMutation.reset();

    const formData = new FormData(event.currentTarget);
    const validationResult = createFolderSchema.safeParse({
      name: formData.get('name'),
    });

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;
      setNameError(errors.name?.[0]);
      return;
    }

    setNameError(undefined);
    createFolderMutation.mutate(validationResult.data);
  };

  const requestError =
    createFolderMutation.error instanceof Error
      ? createFolderMutation.error.message
      : undefined;

  return (
    <form
      className="mt-4 border-y border-zinc-200 bg-white px-4 py-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="block text-sm font-medium" htmlFor="folder-name">
        Folder name
      </label>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-700
            focus:ring-2 focus:ring-teal-100
            aria-[invalid=true]:border-red-500"
          id="folder-name"
          name="name"
          type="text"
          maxLength={100}
          required
          autoFocus
          aria-invalid={Boolean(nameError)}
          aria-describedby="folder-name-error"
        />

        <button
          className="h-10 rounded-md border border-zinc-300 px-4
            text-sm font-medium hover:bg-zinc-100"
          type="button"
          onClick={onCancel}
          disabled={createFolderMutation.isPending}
        >
          Cancel
        </button>

        <button
          className="flex h-10 items-center justify-center gap-2
            rounded-md bg-zinc-900 px-4 text-sm font-medium text-white
            hover:bg-zinc-800 disabled:opacity-60"
          type="submit"
          disabled={createFolderMutation.isPending}
        >
          {createFolderMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <FolderPlus className="size-4" aria-hidden="true" />
          )}
          {createFolderMutation.isPending ? 'Creating...' : 'Create folder'}
        </button>
      </div>

      <p
        id="folder-name-error"
        className="mt-2 min-h-5 text-sm text-red-600"
        aria-live="polite"
      >
        {nameError}
      </p>

      {requestError && (
        <p className="text-sm text-red-600" role="alert">
          {requestError}
        </p>
      )}
    </form>
  );
};
