import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CreateFolderForm } from '../components/create-folder-form';
import { DashboardHeader } from '../components/dashboard-header';
import { DiagramList } from '../components/diagram-list';
import {
  DiagramsErrorState,
  DiagramsLoadingState,
} from '../components/diagrams-page-state';
import { FolderNavigation } from '../components/folder-navigation';
import {
  useCreateDiagramMutation,
  useDiagramsQuery,
} from '../queries/diagram-queries';
import { useFoldersQuery } from '../queries/folder-queries';

export const DiagramsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const selectedFolderId = searchParams.get('folderId') ?? undefined;
  const diagramsQuery = useDiagramsQuery(selectedFolderId);
  const foldersQuery = useFoldersQuery();
  const createDiagramMutation = useCreateDiagramMutation();

  if (diagramsQuery.isPending || foldersQuery.isPending) {
    return <DiagramsLoadingState />;
  }

  if (diagramsQuery.isError || foldersQuery.isError) {
    const message =
      diagramsQuery.error?.message ??
      foldersQuery.error?.message ??
      'Unable to load dashboard data';

    return (
      <DiagramsErrorState
        message={message}
        isRetrying={diagramsQuery.isFetching || foldersQuery.isFetching}
        onRetry={() => {
          void diagramsQuery.refetch();
          void foldersQuery.refetch();
        }}
      />
    );
  }

  const handleCreateDiagram = () => {
    createDiagramMutation.mutate(
      {
        name: 'Untitled diagram',
        folderId: selectedFolderId,
      },
      {
        onSuccess: (diagram) => {
          navigate(`/diagrams/${diagram.id}/editor`);
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <DashboardHeader
        isCreating={createDiagramMutation.isPending}
        onCreateDiagram={handleCreateDiagram}
      />

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-semibold">My Diagrams</h1>

        <FolderNavigation
          folders={foldersQuery.data}
          selectedFolderId={selectedFolderId}
          isCreateFolderOpen={isCreateFolderOpen}
          onSelectFolder={(folderId) =>
            setSearchParams(folderId ? { folderId } : {})
          }
          onToggleCreateFolder={() =>
            setIsCreateFolderOpen((isOpen) => !isOpen)
          }
        />

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
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {createDiagramMutation.error.message}
          </p>
        )}

        <DiagramList
          diagrams={diagramsQuery.data}
          folders={foldersQuery.data}
        />
      </section>
    </main>
  );
};
