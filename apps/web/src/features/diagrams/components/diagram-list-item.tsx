import type {
  DiagramSummaryResponse,
  FolderListResponse,
} from '@diagram-flow/contracts';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DeleteDiagramConfirmation } from './delete-diagram-confirmation';
import { MoveDiagramSelect } from './move-diagram-select';
import { RenameDiagramForm } from './rename-diagram-form';
import { DuplicateDiagramButton } from './duplicate-diagram-button';

type DiagramListItemProps = {
  diagram: DiagramSummaryResponse;
  folders: FolderListResponse;
};

export const DiagramListItem = ({ diagram, folders }: DiagramListItemProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (isRenaming) {
    return (
      <RenameDiagramForm
        diagram={diagram}
        onCancel={() => setIsRenaming(false)}
        onRenamed={() => setIsRenaming(false)}
      />
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

        <MoveDiagramSelect diagram={diagram} folders={folders} />

        <button
          className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100"
          type="button"
          onClick={() => setIsRenaming(true)}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Rename
        </button>

        <DuplicateDiagramButton diagramId={diagram.id} />

        <button
          className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </button>
      </div>

      {isConfirmingDelete && (
        <DeleteDiagramConfirmation
          diagram={diagram}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </li>
  );
};
