import { type FolderResponse } from '@diagram-flow/contracts';
import { useDeleteFolderMutation } from '../queries/folder-queries';

type DeleteFolderConfirmationProps = {
  folder: FolderResponse;
  onDeleted: () => void;
  onCancel: () => void;
};

export const DeleteFolderConfirmation = ({
  folder,
  onDeleted,
  onCancel,
}: DeleteFolderConfirmationProps) => {
  const deleteMutation = useDeleteFolderMutation();

  const errorMessage =
    deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : undefined;

  const handleDelete = () => {
    deleteMutation.mutate(folder.id, {
      onSuccess: onDeleted,
    });
  };

  const handleCancel = () => {
    deleteMutation.reset();
    onCancel();
  };

  return (
    <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-zinc-950">
        Delete &quot;{folder.name}&quot;?
      </p>

      <p className="mt-1 text-sm text-zinc-700">
        Diagrams inside this folder will be moved to All diagrams.
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button
          className="h-9 rounded-md border border-zinc-300 bg-white
            px-3 text-sm font-medium hover:bg-zinc-100
            disabled:opacity-60"
          type="button"
          onClick={handleCancel}
          disabled={deleteMutation.isPending}
        >
          Cancel
        </button>

        <button
          className="h-9 rounded-md bg-red-700 px-3 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
        </button>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
