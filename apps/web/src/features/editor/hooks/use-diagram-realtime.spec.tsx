import { act, renderHook } from '@testing-library/react';
import { io } from 'socket.io-client';
import { synchronizeDiagram } from '../api/editor-api';
import { refreshAccessToken } from '../../../shared/api/refresh-access-token';
import { useEditorStore } from '../store/editor-store';
import { useDiagramRealtime } from './use-diagram-realtime';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));
vi.mock('../api/editor-api', () => ({ synchronizeDiagram: vi.fn() }));
vi.mock('../../../shared/api/access-token', () => ({
  getAccessToken: () => 'test-access-token',
}));
vi.mock('../../../shared/api/refresh-access-token', () => ({
  refreshAccessToken: vi.fn(),
}));

const empty = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
const diagramId = '22222222-2222-4222-8222-222222222222';
const handlers = new Map<string, (argument?: unknown) => unknown>();
const socket = {
  on: vi.fn(),
  timeout: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};
const setup = () =>
  renderHook(() =>
    useDiagramRealtime(diagramId, { isLoading: false, loadError: null }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  handlers.clear();
  socket.on.mockImplementation((name, handler) => handlers.set(name, handler));
  socket.timeout.mockReturnValue(socket);
  socket.emit.mockImplementation((_name, _payload, callback) =>
    callback(null, { ok: true }),
  );
  vi.mocked(io).mockReturnValue(socket as unknown as ReturnType<typeof io>);
  vi.mocked(synchronizeDiagram).mockResolvedValue({
    snapshot: empty,
    version: 0,
    acknowledgedIds: [],
  });
  vi.mocked(refreshAccessToken).mockResolvedValue('renewed-test-token');
  useEditorStore.getState().hydrate(empty, 0);
});

it('joins and reconciles pending IDs on every connection without resetting undo', async () => {
  useEditorStore.getState().addNode('rectangle');
  const operation = useEditorStore.getState().pendingOperations[0];
  setup();
  await act(async () => {
    handlers.get('connect')?.();
  });
  expect(synchronizeDiagram).toHaveBeenCalledWith(diagramId, [operation.id]);
  expect(useEditorStore.getState().nodes).toHaveLength(1);
  expect(useEditorStore.getState().undoStack).toHaveLength(1);
  await act(async () => {
    handlers.get('connect')?.();
  });
  expect(synchronizeDiagram).toHaveBeenCalledTimes(2);
});

it('applies a remote operation incrementally and syncs only on a version gap', async () => {
  setup();
  const operation = {
    id: crypto.randomUUID(),
    diagramId,
    userId: null,
    version: 1,
    changes: [{ type: 'node.remove', id: 'missing' }],
  };
  await act(async () => {
    handlers.get('diagram:operation')?.(operation);
  });
  expect(useEditorStore.getState().diagramVersion).toBe(1);
  expect(synchronizeDiagram).not.toHaveBeenCalled();
  await act(async () => {
    handlers.get('diagram:operation')?.({
      ...operation,
      id: crypto.randomUUID(),
      version: 3,
    });
  });
  expect(synchronizeDiagram).toHaveBeenCalledTimes(1);
});

it('renews authentication after the server disconnects an expired session', async () => {
  setup();
  await act(async () => {
    await handlers.get('disconnect')?.('io server disconnect');
  });
  expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  expect(socket.connect).toHaveBeenCalledTimes(1);
});

it('ignores old-session responses and disconnects on unmount', async () => {
  let resolveSync!: (
    value: Awaited<ReturnType<typeof synchronizeDiagram>>,
  ) => void;
  vi.mocked(synchronizeDiagram).mockReturnValue(
    new Promise((resolve) => {
      resolveSync = resolve;
    }),
  );
  const { unmount } = setup();
  act(() => {
    handlers.get('connect')?.();
  });
  act(() => {
    useEditorStore.getState().hydrate(empty, 9);
  });
  await act(async () => {
    resolveSync({ snapshot: empty, version: 10, acknowledgedIds: [] });
  });
  expect(useEditorStore.getState().diagramVersion).toBe(9);
  unmount();
  expect(socket.disconnect).toHaveBeenCalledTimes(1);
});
