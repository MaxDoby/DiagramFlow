import * as z from 'zod';
import {
  diagramNodeSchema,
  diagramNodeDataSchema,
  diagramEdgeSchema,
  diagramSnapshotSchema,
  type DiagramSnapshot,
} from './diagram.contract';

const nodePatchSchema = z.strictObject({
  position: diagramNodeSchema.shape.position.optional(),
  width: diagramNodeSchema.shape.width.optional(),
  height: diagramNodeSchema.shape.height.optional(),
  zIndex: diagramNodeSchema.shape.zIndex.optional(),
  data: z.strictObject(diagramNodeDataSchema.shape).partial().optional(),
});
export const diagramChangeSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('node.add'), node: diagramNodeSchema }),
  z.strictObject({
    type: z.literal('node.update'),
    id: z.string().min(1),
    patch: nodePatchSchema,
  }),
  z.strictObject({ type: z.literal('node.remove'), id: z.string().min(1) }),
  z.strictObject({ type: z.literal('edge.add'), edge: diagramEdgeSchema }),
  z.strictObject({ type: z.literal('edge.remove'), id: z.string().min(1) }),
]);
export const diagramOperationSchema = z.strictObject({
  id: z.uuid(),
  changes: z.array(diagramChangeSchema).min(1).max(1000),
});
export type DiagramOperation = z.infer<typeof diagramOperationSchema>;
export type DiagramChange = z.infer<typeof diagramChangeSchema>;
export const diagramOperationEventSchema = diagramOperationSchema.extend({
  diagramId: z.uuid(),
  version: z.int().positive(),
  userId: z.uuid().nullable(),
});
export type DiagramOperationEvent = z.infer<typeof diagramOperationEventSchema>;
export const diagramSyncInputSchema = z.strictObject({
  pendingIds: z.array(z.uuid()).max(500),
});
export type DiagramSyncInput = z.infer<typeof diagramSyncInputSchema>;
export const diagramSyncResponseSchema = z.object({
  snapshot: diagramSnapshotSchema,
  version: z.int().nonnegative(),
  acknowledgedIds: z.array(z.uuid()),
});
export type DiagramSyncResponse = z.infer<typeof diagramSyncResponseSchema>;

/** Only persistent fields cross the wire; selection and React Flow measurements stay local. */
export const persistentDiagramSnapshot = (
  snapshot: DiagramSnapshot,
): DiagramSnapshot => ({
  ...snapshot,
  nodes: snapshot.nodes.map(
    ({ id, type, position, width, height, zIndex, data }) => ({
      id,
      type,
      position,
      width,
      height,
      zIndex,
      data,
    }),
  ),
  edges: snapshot.edges.map(
    ({
      id,
      source,
      target,
      type,
      data,
      sourceHandle,
      targetHandle,
      markerEnd,
    }) => ({
      id,
      source,
      target,
      ...(type !== undefined ? { type } : {}),
      ...(data !== undefined ? { data } : {}),
      ...(sourceHandle !== undefined ? { sourceHandle } : {}),
      ...(targetHandle !== undefined ? { targetHandle } : {}),
      ...(markerEnd !== undefined ? { markerEnd } : {}),
    }),
  ),
});

export const applyDiagramChanges = (
  snapshot: DiagramSnapshot,
  changes: DiagramChange[],
): DiagramSnapshot => {
  let nodes = [...snapshot.nodes];
  let edges = [...snapshot.edges];
  for (const change of changes) {
    switch (change.type) {
      case 'node.add':
        if (!nodes.some((node) => node.id === change.node.id))
          nodes.push(change.node);
        break;
      case 'node.update':
        nodes = nodes.map((node) =>
          node.id === change.id
            ? {
                ...node,
                ...change.patch,
                data: { ...node.data, ...change.patch.data },
              }
            : node,
        );
        break;
      case 'node.remove':
        nodes = nodes.filter((node) => node.id !== change.id);
        edges = edges.filter(
          (edge) => edge.source !== change.id && edge.target !== change.id,
        );
        break;
      case 'edge.add':
        if (
          !edges.some((edge) => edge.id === change.edge.id) &&
          nodes.some((node) => node.id === change.edge.source) &&
          nodes.some((node) => node.id === change.edge.target)
        )
          edges.push(change.edge);
        break;
      case 'edge.remove':
        edges = edges.filter((edge) => edge.id !== change.id);
        break;
    }
  }
  return { ...snapshot, nodes, edges };
};

export const diffDiagramSnapshots = (
  before: DiagramSnapshot,
  after: DiagramSnapshot,
): DiagramChange[] => {
  const left = persistentDiagramSnapshot(before);
  const right = persistentDiagramSnapshot(after);
  const changes: DiagramChange[] = [];
  const equal = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  for (const node of left.nodes)
    if (!right.nodes.some((next) => next.id === node.id))
      changes.push({ type: 'node.remove', id: node.id });
  for (const node of right.nodes) {
    const previous = left.nodes.find((item) => item.id === node.id);
    if (!previous) {
      changes.push({ type: 'node.add', node });
      continue;
    }
    const patch: z.infer<typeof nodePatchSchema> = {};
    for (const key of ['position', 'width', 'height', 'zIndex'] as const) {
      if (!equal(previous[key], node[key]))
        Object.assign(patch, { [key]: node[key] });
    }
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(diagramNodeDataSchema.shape))
      if (!equal(previous.data[key], node.data[key]))
        data[key] = node.data[key];
    if (Object.keys(data).length)
      patch.data = nodePatchSchema.shape.data.parse(data);
    if (Object.keys(patch).length)
      changes.push({ type: 'node.update', id: node.id, patch });
  }
  for (const edge of left.edges)
    if (!right.edges.some((next) => next.id === edge.id))
      changes.push({ type: 'edge.remove', id: edge.id });
  for (const edge of right.edges) {
    const previous = left.edges.find((item) => item.id === edge.id);
    if (!previous) changes.push({ type: 'edge.add', edge });
    else if (!equal(previous, edge))
      changes.push(
        { type: 'edge.remove', id: edge.id },
        { type: 'edge.add', edge },
      );
  }
  return changes;
};
