import { act, renderHook } from '@testing-library/react';
import { DiagramApiError, saveDiagramSnapshot } from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';
import { useDiagramAutosave } from './use-diagram-autosave';

vi.mock('../api/editor-api', async (original) => ({
  ...(await original<typeof import('../api/editor-api')>()),
  saveDiagramSnapshot: vi.fn(),
}));
const snapshot = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
const diagramId = '22222222-2222-4222-8222-222222222222';
const setup = () =>
  renderHook(() =>
    useDiagramAutosave(diagramId, { isLoading: false, loadError: null }),
  );
beforeEach(() => {
  vi.mocked(saveDiagramSnapshot).mockReset();
  useEditorStore.getState().hydrate(snapshot, 0);
});

it('ignores completion of a save from a previous editor session', async () => {
  let resolveSave!: (value: { version: number; updatedAt: string }) => void;
  vi.mocked(saveDiagramSnapshot).mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const { result } = setup();
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.save();
  });
  act(() => {
    useEditorStore.getState().hydrate(snapshot, 7);
  });
  await act(async () => {
    resolveSave({ version: 1, updatedAt: '2030-01-01T12:00:00.000Z' });
    await pending;
  });
  expect(useEditorStore.getState().diagramVersion).toBe(7);
});

it('keeps conflicts blocked after further editing and manual retry', async () => {
  vi.mocked(saveDiagramSnapshot).mockRejectedValue(
    new DiagramApiError(409, 'Conflict'),
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
  expect(result.current.saveError).toContain('Reload');
  expect(saveDiagramSnapshot).toHaveBeenCalledTimes(1);
});

it('serializes rapid saves and preserves edits made while saving', async () => {
  let resolveSave!: (value: { version: number; updatedAt: string }) => void;
  vi.mocked(saveDiagramSnapshot).mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const { result } = setup();
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.save();
    void result.current.save();
  });
  act(() => {
    useEditorStore.getState().addNode('rectangle');
  });
  await act(async () => {
    resolveSave({ version: 1, updatedAt: '2030-01-01T12:00:00.000Z' });
    await pending;
  });
  expect(saveDiagramSnapshot).toHaveBeenCalledTimes(1);
  expect(useEditorStore.getState().isDirty).toBe(true);
  expect(useEditorStore.getState().diagramVersion).toBe(1);
});
