import { Copy } from 'lucide-react';
import { useDuplicateDiagramMutation } from '../queries/diagram-queries';

type DuplicateDiagramButtonProps = {
  diagramId: string;
};

export const DuplicateDiagramButton = ({
  diagramId,
}: DuplicateDiagramButtonProps) => {
  const duplicateMutation = useDuplicateDiagramMutation(diagramId);

  const errorMessage =
    duplicateMutation.error instanceof Error
      ? duplicateMutation.error.message
      : undefined;

  return (
    <div>
      <button
        className="flex h-9 shrink-0 items-center gap-2 rounded-md
          border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={() => duplicateMutation.mutate()}
        disabled={duplicateMutation.isPending}
        aria-busy={duplicateMutation.isPending}
      >
        <Copy className="size-4" aria-hidden="true" />
        {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
      </button>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
