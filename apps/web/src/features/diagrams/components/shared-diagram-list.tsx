import type { DiagramListResponse } from '@diagram-flow/contracts';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

type SharedDiagramListProps = {
  diagrams: DiagramListResponse;
};

export const SharedDiagramList = ({ diagrams }: SharedDiagramListProps) => {
  if (diagrams.length === 0) {
    return (
      <div
        className="mt-4 flex min-h-40 flex-col items-center
        justify-center border-y border-dashed border-zinc-300 text-center"
      >
        <FileText className="mb-3 size-8 text-zinc-400" aria-hidden="true" />
        <p className="text-sm font-medium">No diagrams shared with you</p>
      </div>
    );
  }

  return (
    <ul
      className="mt-4 divide-y divide-zinc-200 rounded-md border
      border-zinc-200 bg-white"
    >
      {diagrams.map((diagram) => (
        <li key={diagram.id}>
          <Link
            className="flex min-h-16 items-center gap-4 px-4 py-3
              hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"
            to={`/diagrams/${diagram.id}/editor`}
          >
            <span
              className="flex size-10 shrink-0 items-center
              justify-center rounded-md bg-sky-50 text-sky-700"
            >
              <FileText className="size-5" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {diagram.name}
            </span>

            <ArrowRight
              className="size-4 shrink-0 text-zinc-400"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
};
