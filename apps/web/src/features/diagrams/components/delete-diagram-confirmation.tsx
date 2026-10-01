import type { DiagramSummaryResponse } from '@diagram-flow/contracts';

import { useDeleteDiagramMutation } from '../queries/diagram-queries';

type DeleteDiagramConfirmationProps = {
  diagram: DiagramSummaryResponse;
  onCancel: () => void;
};

export const DeleteDiagramConfirmation = ({
  diagram,
  onCancel,
}: DeleteDiagramConfirmationProps) => {
  const deleteMutation = useDeleteDiagramMutation(diagram.id);
  const errorMessage =
    deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : undefined;

  const handleCancel = () => {
    deleteMutation.reset();
    onCancel();
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 pt-3">
        <p className="mr-auto text-sm text-zinc-700">
          Delete &quot;{diagram.name}&quot;?
        </p>

        <button
          className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100"
          type="button"
          onClick={handleCancel}
          disabled={deleteMutation.isPending}
        >
          Cancel
        </button>

        <button
          className="h-9 rounded-md bg-red-700 px-3 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
          type="button"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Confirm delete'}
        </button>
      </div>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </>
  );
};
