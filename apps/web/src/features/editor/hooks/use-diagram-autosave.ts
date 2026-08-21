import { useCallback, useEffect, useState } from 'react';

import { DiagramApiError, saveDiagramSnapshot } from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';

const AUTOSAVE_DELAY_MS = 1_000;

type DiagramAutosaveOptions = {
  isLoading: boolean;
  loadError: string | null;
};

export const useDiagramAutosave = (
  diagramId: string | undefined,
  { isLoading, loadError }: DiagramAutosaveOptions,
) => {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const viewport = useEditorStore((state) => state.viewport);
  const diagramVersion = useEditorStore((state) => state.diagramVersion);
  const editRevision = useEditorStore((state) => state.editRevision);
  const isDirty = useEditorStore((state) => state.isDirty);
  const saveError = useEditorStore((state) => state.saveError);
  const markSaved = useEditorStore((state) => state.markSaved);
  const setSaveError = useEditorStore((state) => state.setSaveError);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async () => {
    if (!diagramId || isSaving) {
      return;
    }

    const revisionBeingSaved = editRevision;
    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveDiagramSnapshot(diagramId, {
        snapshot: { nodes, edges, viewport },
        expectedVersion: diagramVersion,
      });

      markSaved(result.version, revisionBeingSaved);
    } catch (error: unknown) {
      setSaveError(
        error instanceof DiagramApiError && error.status === 409
          ? 'The diagram changed elsewhere. Reload before saving.'
          : 'Unable to save the diagram',
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    diagramId,
    diagramVersion,
    edges,
    editRevision,
    isSaving,
    markSaved,
    nodes,
    setSaveError,
    viewport,
  ]);

  useEffect(() => {
    if (
      !diagramId ||
      !isDirty ||
      isLoading ||
      isSaving ||
      loadError ||
      saveError
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [diagramId, isDirty, isLoading, isSaving, loadError, save, saveError]);

  return { isDirty, isSaving, saveError, save };
};
