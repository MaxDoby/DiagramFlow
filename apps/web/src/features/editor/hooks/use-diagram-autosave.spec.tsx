import { act, renderHook } from '@testing-library/react';
import type { DiagramOperationEvent } from '@diagram-flow/contracts';
import {
  DiagramApiError,
  submitDiagramOperation,
  synchronizeDiagram,
} from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';
import { useDiagramAutosave } from './use-diagram-autosave';

vi.mock('../api/editor-api', async (original) => ({
  ...(await original<typeof import('../api/editor-api')>()),
  submitDiagramOperation: vi.fn(),
  synchronizeDiagram: vi.fn(),
}));
const snapshot = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
const diagramId = '22222222-2222-4222-8222-222222222222';
const setup = () =>
  renderHook(() =>
    useDiagramAutosave(diagramId, { isLoading: false, loadError: null }),
  );
const event = (): DiagramOperationEvent => ({
  ...useEditorStore.getState().pendingOperations[0],
  diagramId,
  userId: null,
  version: 1,
});
beforeEach(() => {
  vi.mocked(submitDiagramOperation).mockReset();
  vi.mocked(synchronizeDiagram).mockReset();
  useEditorStore.getState().hydrate(snapshot, 0);
  useEditorStore.getState().addNode('rectangle');
});

it('ignores completion from a previous editor session', async () => {
  let resolveSave!: (value: DiagramOperationEvent) => void;
  vi.mocked(submitDiagramOperation).mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const { result } = setup();
  const saved = event();
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.save();
  });
  act(() => {
    useEditorStore.getState().hydrate(snapshot, 7);
  });
  await act(async () => {
    resolveSave(saved);
    await pending;
  });
  expect(useEditorStore.getState().diagramVersion).toBe(7);
});

it('does not repeatedly send a rejected operation', async () => {
  vi.mocked(submitDiagramOperation).mockRejectedValue(
    new DiagramApiError(403, 'Forbidden'),
  );
  const { result } = setup();
  await act(async () => {
    await result.current.save();
  });
  act(() => {
    useEditorStore.getState().addNode('rectangle');
  });
  await act(async () => {
    await result.current.save();
  });
  expect(result.current.hasSaveConflict).toBe(true);
  expect(result.current.saveError).toContain('rejected');
  expect(submitDiagramOperation).toHaveBeenCalledTimes(1);
});

it('serializes saves and preserves changes made while saving', async () => {
  let resolveSave!: (value: DiagramOperationEvent) => void;
  vi.mocked(submitDiagramOperation).mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const { result } = setup();
  const saved = event();
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.save();
    void result.current.save();
  });
  act(() => {
    useEditorStore.getState().addNode('circle');
  });
  await act(async () => {
    resolveSave(saved);
    await pending;
  });
  expect(submitDiagramOperation).toHaveBeenCalledTimes(1);
  expect(useEditorStore.getState().isDirty).toBe(true);
  expect(useEditorStore.getState().nodes).toHaveLength(2);
  expect(useEditorStore.getState().diagramVersion).toBe(1);
});

it('retries the same immutable operation after a lost response', async () => {
  vi.mocked(submitDiagramOperation).mockRejectedValueOnce(new Error('Network'));
  const { result } = setup();
  await act(async () => {
    await result.current.save();
  });
  const first = vi.mocked(submitDiagramOperation).mock.calls[0][1];
  act(() => {
    useEditorStore.getState().addNode('circle');
  });
  vi.mocked(submitDiagramOperation).mockResolvedValue({
    ...first,
    diagramId,
    userId: null,
    version: 1,
  });
  await act(async () => {
    await result.current.save();
  });
  expect(vi.mocked(submitDiagramOperation).mock.calls[1][1]).toEqual(first);
  expect(useEditorStore.getState().pendingOperations).toHaveLength(1);
});
