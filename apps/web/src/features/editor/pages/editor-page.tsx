import { useParams } from 'react-router-dom';

import { EditorCanvas } from '../components/editor-canvas';
import { useDiagramAutosave } from '../hooks/use-diagram-autosave';
import { useDiagramLoader } from '../hooks/use-diagram-loader';
import './editor-page.css';

export const EditorPage = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const { isLoading, loadError } = useDiagramLoader(diagramId);
  const { isDirty, isSaving, saveError, save } = useDiagramAutosave(diagramId, {
    isLoading,
    loadError,
  });

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
      <EditorCanvas
        isDirty={isDirty}
        isSaving={isSaving}
        saveError={saveError}
        onSave={() => void save()}
      />
    </main>
  );
};

export default EditorPage;
