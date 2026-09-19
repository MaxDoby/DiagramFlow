import { useBlocker, useParams } from 'react-router-dom';

import { EditorCanvas } from '../components/editor-canvas';
import { useDiagramAutosave } from '../hooks/use-diagram-autosave';
import { useDiagramLoader } from '../hooks/use-diagram-loader';
import './editor-page.css';
import { useEffect } from 'react';

export const EditorPage = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  return <EditorSession key={diagramId} diagramId={diagramId} />;
};

const EditorSession = ({ diagramId }: { diagramId?: string }) => {
  const { isLoading, loadError } = useDiagramLoader(diagramId);
  const { isDirty, isSaving, saveError, hasSaveConflict, save } =
    useDiagramAutosave(diagramId, {
      isLoading,
      loadError,
    });

  const blocker = useBlocker(isDirty || isSaving);
  useEffect(() => {
    if (!isDirty && !isSaving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, isSaving]);

  if (!diagramId) {
    return (
      <main className="editor-page editor-page--message">
        <p>Invalid diagram URL.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="editor-page editor-page--message">
        <p>Loading diagram...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="editor-page editor-page--message">
        <p role="alert">{loadError}</p>
      </main>
    );
  }

  return (
    <main className="editor-page">
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
          <div
            className="max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-label="Unsaved changes"
          >
            <p>
              You have unsaved changes. Stay to save them, or discard them and
              leave.
            </p>
            <button
              className="editor-toolbar__button"
              onClick={() => blocker.reset()}
            >
              Stay
            </button>
            <button
              className="editor-toolbar__button"
              disabled={isSaving}
              onClick={() => blocker.proceed()}
            >
              Discard and leave
            </button>
          </div>
        </div>
      )}
      <EditorCanvas
        diagramId={diagramId}
        isDirty={isDirty}
        isSaving={isSaving}
        saveError={saveError}
        hasSaveConflict={hasSaveConflict}
        onSave={() => void save()}
      />
    </main>
  );
};

export default EditorPage;
