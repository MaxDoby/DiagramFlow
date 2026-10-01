import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DiagramApiError,
  submitDiagramOperation,
  synchronizeDiagram,
} from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';

type DiagramAutosaveOptions = { isLoading: boolean; loadError: string | null };

export const useDiagramAutosave = (
  diagramId: string | undefined,
  { isLoading, loadError }: DiagramAutosaveOptions,
) => {
  const pending = useEditorStore((s) => s.pendingOperations);
  const firstPendingId = pending[0]?.id;
  const isDirty = useEditorStore((s) => s.isDirty);
  const saveError = useEditorStore((s) => s.saveError);
  const hasSaveConflict = useEditorStore((s) => s.hasSaveConflict);
  const sessionId = useEditorStore((s) => s.sessionId);
  const [isSaving, setIsSaving] = useState(false);
  const inFlight = useRef(false);
  const active = useRef(false);
  const retryDelay = useRef(100);
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
      !state.pendingOperations.length ||
      isLoading ||
      loadError ||
      inFlight.current ||
      state.hasSaveConflict
    )
      return;
    const operation = state.prepareOperation();
    if (!operation) return;
    const savedSession = state.sessionId;
    const isCurrent = () =>
      active.current && useEditorStore.getState().sessionId === savedSession;
    inFlight.current = true;
    setIsSaving(true);
    state.setSaveError(null);
    try {
      const event = await submitDiagramOperation(diagramId, operation);
      if (isCurrent()) {
        const current = useEditorStore.getState();
        const sequential = current.receiveOperation(event);
        if (
          !sequential ||
          useEditorStore
            .getState()
            .pendingOperations.some((op) => op.id === operation.id)
        ) {
          const response = await synchronizeDiagram(
            diagramId,
            useEditorStore.getState().pendingOperations.map((op) => op.id),
          );
          if (isCurrent()) useEditorStore.getState().reconcile(response);
        }
      }
      retryDelay.current = 100;
    } catch (error: unknown) {
      if (isCurrent()) {
        retryDelay.current = Math.min(
          Math.max(retryDelay.current * 2, 1000),
          10000,
        );
        if (
          error instanceof DiagramApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          ![408, 425, 429].includes(error.status)
        ) {
          useEditorStore.setState({ hasSaveConflict: true });
          state.setSaveError(
            'The operation was rejected. Keep this page open and check your access.',
          );
        } else
          state.setSaveError(
            'Connection interrupted. Changes will be retried automatically.',
          );
      }
    } finally {
      inFlight.current = false;
      if (active.current) setIsSaving(false);
    }
  }, [diagramId, isLoading, loadError]);

  useEffect(() => {
    if (
      !diagramId ||
      !firstPendingId ||
      isLoading ||
      isSaving ||
      loadError ||
      hasSaveConflict
    )
      return;
    const timer = window.setTimeout(() => {
      void save();
    }, retryDelay.current);
    return () => window.clearTimeout(timer);
  }, [
    diagramId,
    firstPendingId,
    sessionId,
    isLoading,
    isSaving,
    loadError,
    hasSaveConflict,
    save,
  ]);

  return { isDirty, isSaving, saveError, hasSaveConflict, save };
};
