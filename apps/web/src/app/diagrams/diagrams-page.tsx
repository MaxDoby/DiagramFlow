import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { listFolders } from './folder-api';
import {
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  FileText,
  Plus,
  Workflow,
  Folder,
  LayoutGrid,
  FolderPlus,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createDiagram, listDiagrams } from '../editor/diagram-api';
import { CreateFolderForm } from './create-folder-form';
import { DiagramListItem } from './diagram-list-item';

export const DiagramsPage = () => {
  const navigate = useNavigate();

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFolderId = searchParams.get('folderId') ?? undefined;

  const diagramsQuery = useQuery({
    queryKey: ['diagrams', selectedFolderId ?? 'all'],
    queryFn: () => listDiagrams(selectedFolderId),
  });

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: listFolders,
  });

  const createDiagramMutation = useMutation({
    mutationFn: () =>
      createDiagram({
        name: 'Untitled diagram',
        folderId: selectedFolderId,
      }),
    onSuccess: (diagram) => {
      navigate(`/diagrams/${diagram.id}/editor`);
    },
  });

  if (diagramsQuery.isPending || foldersQuery.isPending) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-zinc-50
      text-zinc-950"
      >
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <LoaderCircle
            className="size-5 animate-spin text-teal-700"
            aria-hidden="true"
          />
          Loading diagrams...
        </div>
      </main>
    );
  }

  if (diagramsQuery.isError || foldersQuery.isError) {
    const queryErrorMessage =
      diagramsQuery.error?.message ??
      foldersQuery.error?.message ??
      'Unable to load Dashboard data';
    return (
      <main
        className="grid min-h-screen place-items-center bg-zinc-50
      px-5 text-zinc-950"
      >
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
            {queryErrorMessage}
          </p>
          <button
            className="mx-auto mt-5 flex h-10 items-center gap-2
            rounded-md border border-zinc-300 bg-white px-4 text-sm
            font-medium hover:bg-zinc-100 disabled:opacity-60"
            type="button"
            onClick={() => {
              void diagramsQuery.refetch();
              void foldersQuery.refetch();
            }}
            disabled={diagramsQuery.isFetching || foldersQuery.isFetching}
          >
            <RefreshCw
              className={`size-4 ${
                diagramsQuery.isFetching || foldersQuery.isFetching
                  ? 'animate-spin'
                  : ''
              }`}
              aria-hidden="true"
            />
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            className="flex items-center gap-3 font-semibold"
            to="/diagrams"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-teal-700 text-white">
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            DiagramFlow
          </Link>

          <button
            className="flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800
          disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => createDiagramMutation.mutate()}
            disabled={createDiagramMutation.isPending}
            aria-busy={createDiagramMutation.isPending}
          >
            <Plus className="size-4" aria-hidden="true" />
            {createDiagramMutation.isPending ? 'Creating...' : 'Create diagram'}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-semibold">My Diagrams</h1>

        <nav
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="Diagram folders"
        >
          <button
            className="flex h-10 shrink-0 items-center gap-2 rounded-md
      border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white"
            type="button"
            onClick={() => setSearchParams({})}
            aria-pressed={!selectedFolderId}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            All diagrams
          </button>

          {foldersQuery.data.map((folder) => (
            <button
              className="flex h-10 shrink-0 items-center gap-2 rounded-md
        border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white"
              type="button"
              key={folder.id}
              onClick={() => setSearchParams({ folderId: folder.id })}
              aria-pressed={selectedFolderId === folder.id}
            >
              <Folder className="size-4" aria-hidden="true" />
              {folder.name}
              <span className="text-xs opacity-70">{folder.diagramCount}</span>
            </button>
          ))}

          <button
            className="flex h-10 shrink-0 items-center gap-2 rounded-md border
    border-dashed border-zinc-400 bg-white px-3 text-sm font-medium
    text-zinc-700 hover:bg-zinc-100"
            type="button"
            onClick={() => setIsCreateFolderOpen((isOpen) => !isOpen)}
            aria-expanded={isCreateFolderOpen}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
            New folder
          </button>
        </nav>

        {isCreateFolderOpen && (
          <CreateFolderForm
            onCreated={(folder) => {
              setSearchParams({ folderId: folder.id });
              setIsCreateFolderOpen(false);
            }}
            onCancel={() => setIsCreateFolderOpen(false)}
          />
        )}

        {createDiagramMutation.isError && (
          <p
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-4
      py-3 text-sm text-red-700"
            role="alert"
          >
            {createDiagramMutation.error.message}
          </p>
        )}

        {diagramsQuery.data.length === 0 ? (
          <div className="mt-6 flex min-h-64 flex-col items-center justify-center border-y border-dashed border-zinc-300 text-center">
            <FileText
              className="mb-4 size-9 text-zinc-400"
              aria-hidden="true"
            />
            <h2 className="text-base font-medium">No diagrams yet</h2>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
            {diagramsQuery.data.map((diagram) => (
              <DiagramListItem
                key={diagram.id}
                diagram={diagram}
                folders={foldersQuery.data}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};
