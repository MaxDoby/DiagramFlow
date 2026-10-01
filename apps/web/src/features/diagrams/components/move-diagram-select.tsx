import type {
  DiagramSummaryResponse,
  FolderListResponse,
} from '@diagram-flow/contracts';
import type { ChangeEvent } from 'react';

import { useMoveDiagramMutation } from '../queries/diagram-queries';

type MoveDiagramSelectProps = {
  diagram: DiagramSummaryResponse;
  folders: FolderListResponse;
};

export const MoveDiagramSelect = ({
  diagram,
  folders,
}: MoveDiagramSelectProps) => {
  const moveMutation = useMoveDiagramMutation(diagram.id);
  const errorMessage =
    moveMutation.error instanceof Error
      ? moveMutation.error.message
      : undefined;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    moveMutation.mutate(event.target.value || null);
  };

  return (
    <div>
      <label className="sr-only" htmlFor={`diagram-folder-${diagram.id}`}>
        Move diagram to folder
      </label>
      <select
        className="h-9 max-w-44 rounded-md border border-zinc-300 bg-white px-2 text-sm disabled:opacity-60"
        id={`diagram-folder-${diagram.id}`}
        value={diagram.folderId ?? ''}
        onChange={handleChange}
        disabled={moveMutation.isPending}
      >
        <option value="">No folder</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
