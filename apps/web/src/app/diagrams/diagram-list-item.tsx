import { useState, type SubmitEvent, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateDiagramSchema,
  type DiagramSummaryResponse,
  type FolderListResponse,
  type UpdateDiagramInput,
} from '@diagram-flow/contracts';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import { updateDiagram, deleteDiagram } from '../editor/diagram-api';

type DiagramListItemProps = {
  diagram: DiagramSummaryResponse;
  folders: FolderListResponse;
};

export const DiagramListItem = ({ diagram, folders }: DiagramListItemProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameError, setNameError] = useState<string>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: (input: UpdateDiagramInput) => updateDiagram(diagram.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['diagrams'],
      });

      setNameError(undefined);
      setIsRenaming(false);
    },
  });

  const moveMutation = useMutation({
    mutationFn: (folderId: string | null) =>
      updateDiagram(diagram.id, { folderId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['diagrams'] }),
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiagram(diagram.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['diagrams'] }),
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
      ]);
    },
  });

  const deleteError =
    deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : undefined;

  const handleFolderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const folderId = event.target.value || null;
    moveMutation.mutate(folderId);
  };

  const moveError =
    moveMutation.error instanceof Error
      ? moveMutation.error.message
      : undefined;

  const handleRename = (event: SubmitEvent<HTMLFormElement>) => {
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
    renameMutation.mutate(validationResult.data);
  };

  const handleCancel = () => {
    renameMutation.reset();
    setNameError(undefined);
    setIsRenaming(false);
  };

  const requestError =
    renameMutation.error instanceof Error
      ? renameMutation.error.message
      : undefined;

  if (isRenaming) {
    return (
      <li className="px-4 py-3">
        <form onSubmit={handleRename} noValidate>
          <label className="sr-only" htmlFor={`diagram-name-${diagram.id}`}>
            Diagram name
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="h-10 min-w-0 flex-1 rounded-md border
                border-zinc-300 px-3 text-sm outline-none
                focus:border-teal-700 focus:ring-2 focus:ring-teal-100
                aria-[invalid=true]:border-red-500"
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
              className="h-10 rounded-md border border-zinc-300 px-4
                text-sm font-medium hover:bg-zinc-100"
              type="button"
              onClick={handleCancel}
              disabled={renameMutation.isPending}
            >
              Cancel
            </button>

            <button
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm
                font-medium text-white hover:bg-zinc-800
                disabled:opacity-60"
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
  }

  return (
    <li className="px-4 py-3 hover:bg-zinc-50">
      <div className="flex min-h-14 flex-wrap items-center gap-3">
        <Link
          className="flex min-w-0 flex-1 basis-full items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:basis-auto"
          to={`/diagrams/${diagram.id}/editor`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-medium">{diagram.name}</span>
        </Link>

        <label className="sr-only" htmlFor={`diagram-folder-${diagram.id}`}>
          Move diagram to folder
        </label>
        <select
          className="h-9 max-w-44 rounded-md border border-zinc-300
          bg-white px-2 text-sm disabled:opacity-60"
          id={`diagram-folder-${diagram.id}`}
          value={diagram.folderId ?? ''}
          onChange={handleFolderChange}
          disabled={moveMutation.isPending}
        >
          <option value="">No folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        <button
          className="flex h-9 shrink-0 items-center gap-2 rounded-md
          border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100"
          type="button"
          onClick={() => setIsRenaming(true)}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Rename
        </button>

        <button
          className="flex h-9 shrink-0 items-center gap-2 rounded-md border
    border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
          type="button"
          onClick={() => {
            deleteMutation.reset();
            setIsConfirmingDelete(true);
          }}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </button>
      </div>

      {moveError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {moveError}
        </p>
      )}

      {isConfirmingDelete && (
        <div
          className="mt-3 flex flex-wrap items-center justify-end gap-2
    border-t border-zinc-200 pt-3"
        >
          <p className="mr-auto text-sm text-zinc-700">
            Delete &quot;{diagram.name}&quot;?
          </p>

          <button
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm
        font-medium hover:bg-zinc-100"
            type="button"
            onClick={() => {
              deleteMutation.reset();
              setIsConfirmingDelete(false);
            }}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>

          <button
            className="h-9 rounded-md bg-red-700 px-3 text-sm font-medium
        text-white hover:bg-red-800 disabled:opacity-60"
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
          </button>
        </div>
      )}

      {deleteError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {deleteError}
        </p>
      )}
    </li>
  );
};
