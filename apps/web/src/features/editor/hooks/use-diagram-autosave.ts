import { useCallback, useEffect, useRef, useState } from 'react';
import { DiagramApiError, saveDiagramSnapshot } from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';

const AUTOSAVE_DELAY_MS = 1_000;
type DiagramAutosaveOptions = { isLoading: boolean; loadError: string | null };

export const useDiagramAutosave = (
  diagramId: string | undefined,
  { isLoading, loadError }: DiagramAutosaveOptions,
) => {
  const editRevision = useEditorStore((s) => s.editRevision);
  const isDirty = useEditorStore((s) => s.isDirty);
  const saveError = useEditorStore((s) => s.saveError);
  const hasSaveConflict = useEditorStore((s) => s.hasSaveConflict);
  const sessionId = useEditorStore((s) => s.sessionId);
  const [isSaving, setIsSaving] = useState(false);
  const inFlight = useRef(false);
  const active = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const save = useCallback(async () => {
    const state = useEditorStore.getState();
    if (
      !diagramId ||
      isLoading ||
      loadError ||
      inFlight.current ||
      state.hasSaveConflict
    )
      return;
    const savedSession = state.sessionId;
    const isCurrent = () =>
      active.current && useEditorStore.getState().sessionId === savedSession;
    inFlight.current = true;
    setIsSaving(true);
    state.setSaveError(null);
    try {
      const result = await saveDiagramSnapshot(diagramId, {
        snapshot: {
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        },
        expectedVersion: state.diagramVersion,
      });
      if (isCurrent()) state.markSaved(result.version, state.editRevision);
    } catch (error: unknown) {
      if (isCurrent()) {
        if (error instanceof DiagramApiError && error.status === 409)
          state.setSaveConflict();
        else state.setSaveError('Unable to save the diagram');
      }
    } finally {
      inFlight.current = false;
      if (active.current) setIsSaving(false);
    }
  }, [diagramId, isLoading, loadError]);

  useEffect(() => {
    if (
      !diagramId ||
      !isDirty ||
      isLoading ||
      isSaving ||
      loadError ||
      saveError ||
      hasSaveConflict
    )
      return;
    const timeoutId = window.setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    diagramId,
    editRevision,
    sessionId,
    isDirty,
    isLoading,
    isSaving,
    loadError,
    saveError,
    hasSaveConflict,
    save,
  ]);

  return { isDirty, isSaving, saveError, hasSaveConflict, save };
};
