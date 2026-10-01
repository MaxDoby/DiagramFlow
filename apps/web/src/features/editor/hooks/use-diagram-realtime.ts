import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { diagramOperationEventSchema } from '@diagram-flow/contracts';
import { getAccessToken } from '../../../shared/api/access-token';
import { refreshAccessToken } from '../../../shared/api/refresh-access-token';
import { synchronizeDiagram } from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';

type DiagramRealtimeOptions = { isLoading: boolean; loadError: string | null };

export const useDiagramRealtime = (
  diagramId: string | undefined,
  { isLoading, loadError }: DiagramRealtimeOptions,
) => {
  useEffect(() => {
    if (!diagramId || isLoading || loadError || !getAccessToken()) return;
    let active = true;
    let syncing = false;
    let syncAgain = false;
    let renewals = 0;
    const session = useEditorStore.getState().sessionId;
    const isCurrent = () =>
      active && useEditorStore.getState().sessionId === session;
    const synchronize = async () => {
      if (!isCurrent()) return;
      if (syncing) {
        syncAgain = true;
        return;
      }
      syncing = true;
      try {
        const response = await synchronizeDiagram(
          diagramId,
          useEditorStore.getState().pendingOperations.map((op) => op.id),
        );
        if (isCurrent()) useEditorStore.getState().reconcile(response);
      } catch {
        if (isCurrent())
          useEditorStore
            .getState()
            .setSaveError('Unable to synchronize. Retrying when connected.');
      } finally {
        syncing = false;
        if (syncAgain && isCurrent()) {
          syncAgain = false;
          void synchronize();
        }
      }
    };
    const socket = io(import.meta.env.VITE_REALTIME_URL || '/', {
      auth: (callback) => callback({ token: getAccessToken() }),
    });
    socket.on('connect', () => {
      renewals = 0;
      socket
        .timeout(5000)
        .emit(
          'diagram:join',
          { diagramId },
          (error: Error | null, response: { ok: boolean } | undefined) => {
            if (!isCurrent()) return;
            if (error) {
              socket.disconnect();
              socket.connect();
              return;
            }
            if (!response?.ok) {
              useEditorStore
                .getState()
                .setSaveError('Unable to join the diagram. Check your access.');
              socket.disconnect();
              return;
            }
            void synchronize();
          },
        );
    });
    socket.on('diagram:operation', (payload: unknown) => {
      const result = diagramOperationEventSchema.safeParse(payload);
      if (
        !result.success ||
        result.data.diagramId !== diagramId ||
        !isCurrent()
      )
        return;
      if (!useEditorStore.getState().receiveOperation(result.data))
        void synchronize();
    });
    socket.on('diagram:updated', () => {
      void synchronize();
    });
    socket.on('connect_error', async (error: Error) => {
      if (!isCurrent() || error.message !== 'Unauthorized' || renewals >= 1)
        return;
      renewals++;
      try {
        await refreshAccessToken();
        if (isCurrent()) socket.connect();
      } catch {
        if (isCurrent())
          useEditorStore
            .getState()
            .setSaveError('Session expired. Sign in again.');
      }
    });
    socket.on('disconnect', async (reason) => {
      if (reason !== 'io server disconnect' || !isCurrent()) return;
      try {
        await refreshAccessToken();
        if (isCurrent()) socket.connect();
      } catch {
        if (isCurrent())
          useEditorStore
            .getState()
            .setSaveError('Session expired. Sign in again.');
      }
    });
    // Also repairs a commit whose broadcast was lost (for example an API restart).
    const timer = window.setInterval(() => {
      void synchronize();
    }, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
      socket.disconnect();
    };
  }, [diagramId, isLoading, loadError]);
};
