import type {
  DiagramListResponse,
  FolderListResponse,
} from '@diagram-flow/contracts';
import { FileText } from 'lucide-react';

import { DiagramListItem } from './diagram-list-item';

type DiagramListProps = {
  diagrams: DiagramListResponse;
  folders: FolderListResponse;
};

export const DiagramList = ({ diagrams, folders }: DiagramListProps) => {
  if (diagrams.length === 0) {
    return (
      <div className="mt-6 flex min-h-64 flex-col items-center justify-center border-y border-dashed border-zinc-300 text-center">
        <FileText className="mb-4 size-9 text-zinc-400" aria-hidden="true" />
        <h2 className="text-base font-medium">No diagrams yet</h2>
      </div>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
      {diagrams.map((diagram) => (
        <DiagramListItem key={diagram.id} diagram={diagram} folders={folders} />
      ))}
    </ul>
  );
};
