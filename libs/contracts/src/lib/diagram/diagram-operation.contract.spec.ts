import { diagramNodeSchema, type DiagramSnapshot } from './diagram.contract';
import {
  applyDiagramChanges,
  diagramOperationSchema,
  diffDiagramSnapshots,
  persistentDiagramSnapshot,
} from './diagram-operation.contract';

const node = diagramNodeSchema.parse({
  id: 'node-1',
  type: 'shape',
  position: { x: 80, y: 80 },
  width: 140,
  height: 80,
  zIndex: 0,
  data: {
    label: 'Rectangle',
    shapeType: 'rectangle',
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 2,
    opacity: 1,
    rotation: 0,
    fontFamily: 'sans',
    textAlign: 'center',
  },
});
const snapshot: DiagramSnapshot = {
  nodes: [node],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

it('generates a field-level patch rather than replacing a node', () => {
  const next = {
    ...snapshot,
    nodes: [{ ...node, data: { ...node.data, label: 'Changed' } }],
  };
  expect(diffDiagramSnapshots(snapshot, next)).toEqual([
    { type: 'node.update', id: node.id, patch: { data: { label: 'Changed' } } },
  ]);
});

it('ignores local selection, measurements and viewport changes', () => {
  const next = {
    ...snapshot,
    viewport: { x: 500, y: 300, zoom: 2 },
    nodes: [{ ...node, selected: true, measured: { width: 140, height: 80 } }],
  };
  expect(diffDiagramSnapshots(snapshot, next)).toEqual([]);
  expect(persistentDiagramSnapshot(next).nodes[0]).not.toHaveProperty(
    'selected',
  );
});

it('preserves independently updated fields across editors', () => {
  const moved = applyDiagramChanges(snapshot, [
    {
      type: 'node.update',
      id: node.id,
      patch: { position: { x: 300, y: 100 } },
    },
  ]);
  const renamed = applyDiagramChanges(moved, [
    { type: 'node.update', id: node.id, patch: { data: { label: 'Renamed' } } },
  ]);
  expect(renamed.nodes[0]).toMatchObject({
    position: { x: 300, y: 100 },
    data: { label: 'Renamed', backgroundColor: '#ffffff' },
  });
});

it('uses server order for simultaneous edits to the same field', () => {
  const result = applyDiagramChanges(snapshot, [
    { type: 'node.update', id: node.id, patch: { data: { label: 'First' } } },
    { type: 'node.update', id: node.id, patch: { data: { label: 'Last' } } },
  ]);
  expect(result.nodes[0].data.label).toBe('Last');
});

it('deletes connected edges and does not resurrect a deleted node for an update', () => {
  const connected = {
    ...snapshot,
    nodes: [node, { ...node, id: 'node-2' }],
    edges: [{ id: 'edge-1', source: node.id, target: 'node-2' }],
  };
  const result = applyDiagramChanges(connected, [
    { type: 'node.remove', id: node.id },
    { type: 'node.update', id: node.id, patch: { width: 200 } },
  ]);
  expect(result.nodes.map((n) => n.id)).toEqual(['node-2']);
  expect(result.edges).toEqual([]);
});

it('does not add duplicate nodes or orphan connectors', () => {
  const result = applyDiagramChanges(snapshot, [
    { type: 'node.add', node },
    {
      type: 'edge.add',
      edge: { id: 'edge-1', source: node.id, target: 'missing' },
    },
  ]);
  expect(result.nodes).toHaveLength(1);
  expect(result.edges).toHaveLength(0);
});

it('round-trips an addition, resize, connection and deletion through operations', () => {
  const next: DiagramSnapshot = {
    ...snapshot,
    nodes: [
      { ...node, width: 220 },
      { ...node, id: 'node-2' },
    ],
    edges: [
      {
        id: 'edge-1',
        source: node.id,
        target: 'node-2',
        type: 'straight',
        data: { connectionType: 'arrow' },
        markerEnd: { type: 'arrowclosed' },
      },
    ],
  };
  expect(
    applyDiagramChanges(snapshot, diffDiagramSnapshots(snapshot, next)),
  ).toEqual(next);
  expect(
    applyDiagramChanges(next, diffDiagramSnapshots(next, snapshot)),
  ).toEqual(snapshot);
});

it('rejects an unknown patch field and an empty or oversized operation', () => {
  const id = crypto.randomUUID();
  expect(diagramOperationSchema.safeParse({ id, changes: [] }).success).toBe(
    false,
  );
  expect(
    diagramOperationSchema.safeParse({
      id,
      changes: [
        { type: 'node.update', id: node.id, patch: { ownerId: 'injected' } },
      ],
    }).success,
  ).toBe(false);
  expect(
    diagramOperationSchema.safeParse({
      id,
      changes: Array.from({ length: 1001 }, () => ({
        type: 'node.remove',
        id: node.id,
      })),
    }).success,
  ).toBe(false);
});
