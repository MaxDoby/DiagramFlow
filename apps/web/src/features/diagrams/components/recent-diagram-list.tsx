import type { DiagramListResponse } from '@diagram-flow/contracts';
import { Clock3, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

type RecentDiagramListProps = {
  diagrams: DiagramListResponse;
};

const recentDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const RecentDiagramList = ({ diagrams }: RecentDiagramListProps) => {
  if (diagrams.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recent-diagrams-heading">
      <h2 id="recent-diagrams-heading" className="text-xl font-semibold">
        Recent
      </h2>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {diagrams.map((diagram) => (
          <li key={diagram.id}>
            <Link
              className="flex min-h-28 flex-col justify-between rounded-md border border-zinc-200 bg-white p-4 hover:border-teal-500 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              to={`/diagrams/${diagram.id}/editor`}
            >
              <span className="flex items-center gap-3">
                <FileText
                  className="size-5 shrink-0 text-teal-700"
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium">
                  {diagram.name}
                </span>
              </span>

              <span className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Clock3 className="size-4" aria-hidden="true" />
                Updated{' '}
                {recentDateFormatter.format(new Date(diagram.updatedAt))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
