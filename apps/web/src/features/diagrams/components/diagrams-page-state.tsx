import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';

export const DiagramsLoadingState = () => (
  <main className="grid min-h-screen place-items-center bg-zinc-50 text-zinc-950">
    <div className="flex items-center gap-3 text-sm text-zinc-600">
      <LoaderCircle
        className="size-5 animate-spin text-teal-700"
        aria-hidden="true"
      />
      Loading diagrams...
    </div>
  </main>
);

type DiagramsErrorStateProps = {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export const DiagramsErrorState = ({
  message,
  isRetrying,
  onRetry,
}: DiagramsErrorStateProps) => (
  <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 text-zinc-950">
    <section
      className="w-full max-w-sm text-center"
      aria-labelledby="diagrams-error-title"
    >
      <TriangleAlert
        className="mx-auto mb-4 size-9 text-red-600"
        aria-hidden="true"
      />
      <h1 id="diagrams-error-title" className="text-lg font-semibold">
        Unable to load diagrams
      </h1>
      <p className="mt-2 text-sm text-zinc-600" role="alert">
        {message}
      </p>
      <button
        className="mx-auto mt-5 flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60"
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <RefreshCw
          className={`size-4 ${isRetrying ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        Try again
      </button>
    </section>
  </main>
);
