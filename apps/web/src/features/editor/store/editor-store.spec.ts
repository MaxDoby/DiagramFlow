import {
  applyDiagramChanges,
  type DiagramOperationEvent,
} from '@diagram-flow/contracts';
import { useEditorStore } from './editor-store';

const empty = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
const remote = (
  changes: DiagramOperationEvent['changes'],
  version = 1,
): DiagramOperationEvent => ({
  id: crypto.randomUUID(),
  diagramId: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  version,
  changes,
});
beforeEach(() => useEditorStore.getState().hydrate(empty, 0));

it('queues only persistent changes, not selection or camera movement', () => {
  useEditorStore.getState().addNode('rectangle');
  const node = useEditorStore.getState().nodes[0];
  useEditorStore
    .getState()
    .onNodesChange([{ type: 'select', id: node.id, selected: true }]);
  useEditorStore.getState().onMoveEnd(null, { x: 10, y: 20, zoom: 2 });
  expect(useEditorStore.getState().pendingOperations).toHaveLength(1);
  expect(
    useEditorStore.getState().pendingOperations[0].changes[0],
  ).toMatchObject({ type: 'node.add' });
});

it('merges remote and pending local changes to different properties of the same node', () => {
  useEditorStore.getState().addNode('rectangle');
  const node = useEditorStore.getState().nodes[0];
  useEditorStore.getState().hydrate({ ...empty, nodes: [node] }, 0);
  useEditorStore.getState().updateNodeData(node.id, { label: 'Local label' });
  useEditorStore
    .getState()
    .receiveOperation(
      remote([
        {
          type: 'node.update',
          id: node.id,
          patch: { position: { x: 300, y: 400 } },
        },
      ]),
    );
  expect(useEditorStore.getState().nodes[0]).toMatchObject({
    position: { x: 300, y: 400 },
    data: { label: 'Local label' },
  });
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().nodes[0]).toMatchObject({
    position: { x: 300, y: 400 },
    data: { label: 'Rectangle' },
  });
});

it('keeps a remote node when undoing a local addition', () => {
  useEditorStore.getState().addNode('rectangle');
  const node = {
    ...useEditorStore.getState().nodes[0],
    id: crypto.randomUUID(),
  };
  useEditorStore
    .getState()
    .receiveOperation(remote([{ type: 'node.add', node }]));
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().nodes.map((n) => n.id)).toEqual([node.id]);
  useEditorStore.getState().redo();
  expect(useEditorStore.getState().nodes).toHaveLength(2);
});

it('does not resurrect a remotely deleted node through undo', () => {
  useEditorStore.getState().addNode('rectangle');
  const node = useEditorStore.getState().nodes[0];
  useEditorStore.getState().hydrate({ ...empty, nodes: [node] }, 0);
  useEditorStore.getState().updateNodeData(node.id, { label: 'Changed' });
  useEditorStore
    .getState()
    .receiveOperation(remote([{ type: 'node.remove', id: node.id }]));
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().nodes).toHaveLength(0);
});

it('acknowledges a lost response without applying the operation twice', () => {
  useEditorStore.getState().addNode('rectangle');
  const operation = useEditorStore.getState().prepareOperation();
  if (!operation) throw new Error('Expected a queued operation');
  const saved = applyDiagramChanges(empty, operation.changes);
  useEditorStore
    .getState()
    .reconcile({
      snapshot: saved,
      version: 1,
      acknowledgedIds: [operation.id],
    });
  expect(useEditorStore.getState().nodes).toHaveLength(1);
  expect(useEditorStore.getState().isDirty).toBe(false);
  expect(useEditorStore.getState().outgoingOperationId).toBeNull();
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().nodes).toHaveLength(0);
});

it('detects gaps and ignores duplicate or old events', () => {
  const event = remote([{ type: 'node.remove', id: 'missing' }], 2);
  expect(useEditorStore.getState().receiveOperation(event)).toBe(false);
  expect(useEditorStore.getState().diagramVersion).toBe(0);
  expect(
    useEditorStore.getState().receiveOperation({ ...event, version: 1 }),
  ).toBe(true);
  expect(
    useEditorStore.getState().receiveOperation({ ...event, version: 1 }),
  ).toBe(true);
  expect(useEditorStore.getState().diagramVersion).toBe(1);
});

it('batches unsent changes but never mutates an already-sent batch', () => {
  useEditorStore.getState().addNode('rectangle');
  useEditorStore.getState().addNode('circle');
  const first = useEditorStore.getState().prepareOperation();
  expect(first?.changes).toHaveLength(2);
  expect(useEditorStore.getState().pendingOperations).toHaveLength(1);
  useEditorStore.getState().addNode('triangle');
  expect(useEditorStore.getState().prepareOperation()).toEqual(first);
  expect(useEditorStore.getState().pendingOperations).toHaveLength(2);
});

it('rebases undo across reconnect while distinguishing acknowledged own edits', () => {
  useEditorStore.getState().addNode('rectangle');
  const node = useEditorStore.getState().nodes[0];
  useEditorStore.getState().hydrate({ ...empty, nodes: [node] }, 0);
  useEditorStore.getState().updateNodeData(node.id, { label: 'Local label' });
  const own = useEditorStore.getState().prepareOperation();
  if (!own) throw new Error('Expected an operation');
  const saved = applyDiagramChanges(
    applyDiagramChanges({ ...empty, nodes: [node] }, own.changes),
    [
      {
        type: 'node.update',
        id: node.id,
        patch: { position: { x: 500, y: 100 } },
      },
    ],
  );
  useEditorStore
    .getState()
    .reconcile({ snapshot: saved, version: 2, acknowledgedIds: [own.id] });
  useEditorStore.getState().undo();
  expect(useEditorStore.getState().nodes[0]).toMatchObject({
    position: { x: 500, y: 100 },
    data: { label: 'Rectangle' },
  });
});
