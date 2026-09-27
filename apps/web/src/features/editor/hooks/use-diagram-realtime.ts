import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { diagramUpdatedEventSchema } from '@diagram-flow/contracts';
import { getAccessToken } from '../../../shared/api/access-token';
import { getDiagram } from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';

type DiagramRealtimeOptions = {
  isLoading: boolean;
  loadError: string | null;
};

export const useDiagramRealtime = (
  diagramId: string | undefined,
  { isLoading, loadError }: DiagramRealtimeOptions,
) => {
  useEffect(() => {
    if (!diagramId || isLoading || loadError) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      return;
    }

    const socket = io('/', {
      auth: { token },
    });

    const handleDiagramUpdated = async (payload: unknown) => {
      const parsePayload = diagramUpdatedEventSchema.safeParse(payload);

      if (!parsePayload.success || parsePayload.data.diagramId !== diagramId) {
        return;
      }

      const state = useEditorStore.getState();

      if (state.diagramVersion >= parsePayload.data.version) {
        return;
      }

      if (state.isDirty) {
        state.setSaveConflict();
        return;
      }

      try {
        const diagram = await getDiagram(diagramId);
        const latestState = useEditorStore.getState();

        if (latestState.isDirty) {
          latestState.setSaveConflict();

          return;
        }
        latestState.hydrate(diagram.snapshot, diagram.version);
      } catch {
        useEditorStore
          .getState()
          .setSaveError('Unable to load the latest diagram version');
      }
    };

    socket.on('connect', () => {
      socket.emit('diagram:join', { diagramId });
    });
    socket.on('diagram:updated', handleDiagramUpdated);

    return () => {
      socket.disconnect();
    };
  }, [diagramId, isLoading, loadError]);
};
