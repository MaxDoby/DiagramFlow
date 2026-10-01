import {
  applyDiagramChanges,
  diffDiagramSnapshots,
  persistentDiagramSnapshot,
  type DiagramOperation,
  type DiagramOperationEvent,
  type DiagramSyncResponse,
  type DiagramConnectionType,
  type DiagramSnapshot,
  type DiagramShapeType,
} from '@diagram-flow/contracts';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnMoveEnd,
  type Viewport,
  MarkerType,
} from '@xyflow/react';
import { create } from 'zustand';

export type EditorNode = DiagramSnapshot['nodes'][number];
export type EditorEdge = DiagramSnapshot['edges'][number];
export type NodeLayerAction =
  | 'bring-to-front'
  | 'bring-forward'
  | 'send-backward'
  | 'bring-to-back';

type EditorHistorySnapshot = Pick<DiagramSnapshot, 'nodes' | 'edges'>;

const createHistorySnapshot = (
  nodes: EditorNode[],
  edges: EditorEdge[],
): EditorHistorySnapshot =>
  structuredClone({
    nodes,
    edges,
  });

const appendUndoSnapshot = (
  undoStack: EditorHistorySnapshot[],
  snapshot: EditorHistorySnapshot,
) => [...undoStack, snapshot].slice(-100);

const recordContentChange = (
  nodes: EditorNode[],
  edges: EditorEdge[],
  undoStack: EditorHistorySnapshot[],
) => ({
  undoStack: appendUndoSnapshot(undoStack, createHistorySnapshot(nodes, edges)),
  redoStack: [],
});

type EditableNodeData = Pick<
  EditorNode['data'],
  | 'label'
  | 'backgroundColor'
  | 'borderColor'
  | 'borderWidth'
  | 'opacity'
  | 'rotation'
  | 'fontFamily'
  | 'textAlign'
>;

type EditorClipboard = {
  nodes: EditorNode[];
  edges: EditorEdge[];
};

type EditorStore = {
  nodes: EditorNode[];
  edges: EditorEdge[];
  undoStack: EditorHistorySnapshot[];
  redoStack: EditorHistorySnapshot[];
  pendingContentSnapshot: EditorHistorySnapshot | null;
  clipboard: EditorClipboard | null;
  viewport: Viewport;
  sessionId: string;
  confirmedSnapshot: DiagramSnapshot;
  pendingOperations: DiagramOperation[];
  outgoingOperationId: string | null;
  prepareOperation: () => DiagramOperation | undefined;
  receiveOperation: (event: DiagramOperationEvent) => boolean;
  reconcile: (response: DiagramSyncResponse) => void;
  hasSaveConflict: boolean;
  diagramVersion: number;
  editRevision: number;
  isDirty: boolean;
  saveError: string | null;
  activeConnectionType: DiagramConnectionType;
  hydrate: (snapshot: DiagramSnapshot, version: number) => void;
  undo: () => void;
  redo: () => void;
  beginContentInteraction: () => void;
  commitContentInteraction: () => void;
  onNodesChange: (changes: NodeChange<EditorNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<EditorEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onMoveEnd: OnMoveEnd;
  addNode: (shapeType: DiagramShapeType) => void;
  addImageNode: (imageUrl: string) => void;
  updateNodeData: (nodeId: string, change: Partial<EditableNodeData>) => void;
  updateNodeDimensions: (
    nodeId: string,
    dimensions: Pick<EditorNode, 'width' | 'height'>,
  ) => void;
  moveNodeLayer: (nodeId: string, action: NodeLayerAction) => void;
  setActiveConnectionType: (connectionType: DiagramConnectionType) => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  setSaveError: (message: string | null) => void;
};

export const MIN_NODE_WIDTH = 60;
export const MIN_NODE_HEIGHT = 40;

const orderNodesByLayer = (nodes: EditorNode[]): EditorNode[] =>
  [...nodes].sort(
    (firstNode, secondNode) =>
      firstNode.zIndex - secondNode.zIndex ||
      firstNode.id.localeCompare(secondNode.id),
  );

const normalizeNodeLayers = (nodes: EditorNode[]): EditorNode[] =>
  nodes.map((node, zIndex) =>
    node.zIndex === zIndex ? node : { ...node, zIndex },
  );

const cleanViewport: Viewport = { x: 0, y: 0, zoom: 1 };
const PASTE_OFFSET = 32;

type DefaultShapeConfig = {
  label: string;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
};

const defaultShapeConfig: Record<DiagramShapeType, DefaultShapeConfig> = {
  rectangle: {
    label: 'Rectangle',
    width: 140,
    height: 80,
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 2,
  },
  circle: {
    label: 'Circle',
    width: 96,
    height: 96,
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 2,
  },
  diamond: {
    label: 'Diamond',
    width: 112,
    height: 92,
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 2,
  },
  triangle: {
    label: 'Triangle',
    width: 120,
    height: 100,
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 2,
  },
  text: {
    label: 'Text',
    width: 140,
    height: 44,
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 0,
  },
  image: {
    label: 'Image',
    width: 180,
    height: 120,
    backgroundColor: '#ffffff',
    borderColor: '#52525b',
    borderWidth: 2,
  },
  'sticky-note': {
    label: 'Sticky note',
    width: 130,
    height: 100,
    backgroundColor: '#fef08a',
    borderColor: '#a16207',
    borderWidth: 2,
  },
  container: {
    label: 'Container',
    width: 360,
    height: 240,
    backgroundColor: '#f4f4f5',
    borderColor: '#71717a',
    borderWidth: 2,
  },
};

const createEditorNode = (
  shapeType: DiagramShapeType,
  nodeIndex: number,
  imageUrl?: string,
): EditorNode => {
  const config = defaultShapeConfig[shapeType];

  return {
    id: crypto.randomUUID(),
    type: 'shape',
    position: {
      x: 80 + (nodeIndex % 4) * 180,
      y: 80 + Math.floor(nodeIndex / 4) * 100,
    },
    width: config.width,
    height: config.height,
    zIndex: nodeIndex,
    data: {
      label: config.label,
      shapeType,
      backgroundColor: config.backgroundColor,
      borderColor: config.borderColor,
      borderWidth: config.borderWidth,
      opacity: 1,
      rotation: 0,
      fontFamily: 'sans',
      textAlign: 'center',
      ...(imageUrl ? { imageUrl } : {}),
    },
  };
};

const createEditorEdge = (
  connection: Connection,
  connectionType: DiagramConnectionType,
): EditorEdge => ({
  id: crypto.randomUUID(),
  ...connection,
  type: connectionType === 'arrow' ? 'straight' : 'default',
  data: {
    connectionType,
  },
  ...(connectionType === 'arrow'
    ? {
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    : {}),
});

const dirtyState = (state: EditorStore) => ({
  editRevision: state.editRevision + 1,
  isDirty: true,
  saveError: state.hasSaveConflict ? state.saveError : null,
});

export const useEditorStore = create<EditorStore>((set, get) => ({
  nodes: [],
  edges: [],
  undoStack: [],
  redoStack: [],
  pendingContentSnapshot: null,
  clipboard: null,
  viewport: cleanViewport,
  sessionId: crypto.randomUUID(),
  confirmedSnapshot: { nodes: [], edges: [], viewport: cleanViewport },
  pendingOperations: [],
  outgoingOperationId: null,
  prepareOperation: () => {
    const state = get();
    const first = state.pendingOperations[0];
    if (!first || state.outgoingOperationId) return first;
    const changes = [...first.changes];
    let count = 1;
    for (const next of state.pendingOperations.slice(1)) {
      if (changes.length + next.changes.length > 1000) break;
      changes.push(...next.changes);
      count++;
    }
    const operation = { id: first.id, changes };
    set({
      outgoingOperationId: first.id,
      pendingOperations: [operation, ...state.pendingOperations.slice(count)],
    });
    return operation;
  },
  receiveOperation: (event) => {
    let accepted = true;
    set((state) => {
      if (event.version <= state.diagramVersion) return state;
      if (event.version !== state.diagramVersion + 1) {
        accepted = false;
        return state;
      }
      const own = state.pendingOperations.some((op) => op.id === event.id);
      const pendingOperations = state.pendingOperations.filter(
        (op) => op.id !== event.id,
      );
      const confirmedSnapshot = applyDiagramChanges(
        state.confirmedSnapshot,
        event.changes,
      );
      const visible = pendingOperations.reduce(
        (snapshot, op) => applyDiagramChanges(snapshot, op.changes),
        confirmedSnapshot,
      );
      const rebase = (snapshot: EditorHistorySnapshot) =>
        applyDiagramChanges(
          { ...snapshot, viewport: state.viewport },
          event.changes,
        );
      return {
        nodes: visible.nodes.map((node) => ({
          ...node,
          selected:
            state.nodes.find((n) => n.id === node.id)?.selected ?? false,
        })),
        edges: visible.edges,
        confirmedSnapshot,
        pendingOperations,
        outgoingOperationId:
          state.outgoingOperationId === event.id
            ? null
            : state.outgoingOperationId,
        diagramVersion: event.version,
        isDirty: pendingOperations.length > 0,
        ...(!own
          ? {
              undoStack: state.undoStack.map(rebase),
              redoStack: state.redoStack.map(rebase),
              pendingContentSnapshot: state.pendingContentSnapshot
                ? rebase(state.pendingContentSnapshot)
                : null,
            }
          : {}),
      };
    });
    return accepted;
  },
  reconcile: (response) =>
    set((state) => {
      if (response.version < state.diagramVersion) return state;
      const acknowledged = new Set(response.acknowledgedIds);
      const ownConfirmed = state.pendingOperations
        .filter((op) => acknowledged.has(op.id))
        .reduce(
          (snapshot, op) => applyDiagramChanges(snapshot, op.changes),
          state.confirmedSnapshot,
        );
      const remoteChanges = diffDiagramSnapshots(
        ownConfirmed,
        response.snapshot,
      );
      const pendingOperations = state.pendingOperations.filter(
        (op) => !acknowledged.has(op.id),
      );
      const visible = pendingOperations.reduce(
        (snapshot, op) => applyDiagramChanges(snapshot, op.changes),
        response.snapshot,
      );
      const rebase = (snapshot: EditorHistorySnapshot) =>
        applyDiagramChanges(
          { ...snapshot, viewport: state.viewport },
          remoteChanges,
        );
      return {
        nodes: visible.nodes.map((node) => ({
          ...node,
          selected:
            state.nodes.find((n) => n.id === node.id)?.selected ?? false,
        })),
        edges: visible.edges,
        confirmedSnapshot: response.snapshot,
        pendingOperations,
        outgoingOperationId:
          state.outgoingOperationId &&
          acknowledged.has(state.outgoingOperationId)
            ? null
            : state.outgoingOperationId,
        diagramVersion: response.version,
        isDirty: pendingOperations.length > 0,
        undoStack: state.undoStack.map(rebase),
        redoStack: state.redoStack.map(rebase),
        pendingContentSnapshot: state.pendingContentSnapshot
          ? rebase(state.pendingContentSnapshot)
          : null,
      };
    }),
  hasSaveConflict: false,
  diagramVersion: 0,
  editRevision: 0,
  isDirty: false,
  saveError: null,
  activeConnectionType: 'connector',

  hydrate: (snapshot, version) =>
    set({
      sessionId: crypto.randomUUID(),
      confirmedSnapshot: persistentDiagramSnapshot(snapshot),
      pendingOperations: [],
      outgoingOperationId: null,
      hasSaveConflict: false,
      clipboard: null,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      undoStack: [],
      redoStack: [],
      pendingContentSnapshot: null,
      viewport: snapshot.viewport,
      diagramVersion: version,
      editRevision: 0,
      isDirty: false,
      saveError: null,
    }),

  undo: () =>
    set((state) => {
      const previousSnapshot = state.undoStack[state.undoStack.length - 1];

      if (!previousSnapshot) {
        return state;
      }

      const currentSnapshot = createHistorySnapshot(state.nodes, state.edges);
      const restoredSnapshot = createHistorySnapshot(
        previousSnapshot.nodes,
        previousSnapshot.edges,
      );
      return {
        ...dirtyState(state),
        nodes: restoredSnapshot.nodes,
        edges: restoredSnapshot.edges,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, currentSnapshot],
      };
    }),

  redo: () =>
    set((state) => {
      const nextSnapshot = state.redoStack[state.redoStack.length - 1];

      if (!nextSnapshot) {
        return state;
      }

      const currentSnapshot = createHistorySnapshot(state.nodes, state.edges);
      const restoredSnapshot = createHistorySnapshot(
        nextSnapshot.nodes,
        nextSnapshot.edges,
      );

      return {
        ...dirtyState(state),
        nodes: restoredSnapshot.nodes,
        edges: restoredSnapshot.edges,
        undoStack: [...state.undoStack, currentSnapshot],
        redoStack: state.redoStack.slice(0, -1),
      };
    }),

  beginContentInteraction: () =>
    set((state) => {
      if (state.pendingContentSnapshot) {
        return state;
      }

      return {
        pendingContentSnapshot: createHistorySnapshot(state.nodes, state.edges),
      };
    }),

  commitContentInteraction: () =>
    set((state) => {
      const pendingSnapshot = state.pendingContentSnapshot;

      if (!pendingSnapshot) {
        return state;
      }

      const currentSnapshot = createHistorySnapshot(state.nodes, state.edges);
      const didContentChange =
        JSON.stringify(pendingSnapshot) !== JSON.stringify(currentSnapshot);

      if (!didContentChange) {
        return {
          pendingContentSnapshot: null,
        };
      }

      return {
        undoStack: appendUndoSnapshot(state.undoStack, pendingSnapshot),
        redoStack: [],
        pendingContentSnapshot: null,
      };
    }),

  onNodesChange: (changes) =>
    set((state) => {
      const hasPersistentChange = changes.some(
        (change) =>
          change.type === 'position' ||
          change.type === 'remove' ||
          change.type === 'add' ||
          change.type === 'replace' ||
          (change.type === 'dimensions' && change.resizing === true),
      );

      return {
        nodes: applyNodeChanges(changes, state.nodes),
        ...(hasPersistentChange ? dirtyState(state) : {}),
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      ...(changes.some((change) => change.type !== 'select')
        ? dirtyState(state)
        : {}),
    })),

  onConnect: (connection) =>
    set((state) => ({
      ...recordContentChange(state.nodes, state.edges, state.undoStack),
      edges: addEdge(
        createEditorEdge(connection, state.activeConnectionType),
        state.edges,
      ),
      ...dirtyState(state),
    })),

  onMoveEnd: (_event, viewport) => set({ viewport }),

  addNode: (shapeType) =>
    set((state) => ({
      ...recordContentChange(state.nodes, state.edges, state.undoStack),
      nodes: [...state.nodes, createEditorNode(shapeType, state.nodes.length)],
      ...dirtyState(state),
    })),

  addImageNode: (imageUrl) =>
    set((state) => ({
      ...recordContentChange(state.nodes, state.edges, state.undoStack),
      nodes: [
        ...state.nodes,
        createEditorNode('image', state.nodes.length, imageUrl),
      ],
      ...dirtyState(state),
    })),

  updateNodeData: (nodeId, changes) =>
    set((state) => {
      const targetNode = state.nodes.find((node) => node.id === nodeId);

      if (!targetNode) {
        return state;
      }

      return {
        ...recordContentChange(state.nodes, state.edges, state.undoStack),
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...changes,
                },
              }
            : node,
        ),
        ...dirtyState(state),
      };
    }),

  updateNodeDimensions: (nodeId, { width, height }) =>
    set((state) => {
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < MIN_NODE_WIDTH ||
        height < MIN_NODE_HEIGHT
      ) {
        return state;
      }

      const targetNode = state.nodes.find((node) => node.id === nodeId);

      if (
        !targetNode ||
        (targetNode.width === width && targetNode.height === height)
      ) {
        return state;
      }

      return {
        ...recordContentChange(state.nodes, state.edges, state.undoStack),
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, width, height } : node,
        ),
        ...dirtyState(state),
      };
    }),

  moveNodeLayer: (nodeId, action) =>
    set((state) => {
      const orderedNodes = orderNodesByLayer(state.nodes);
      const currentIndex = orderedNodes.findIndex((node) => node.id === nodeId);

      if (currentIndex === -1) {
        return state;
      }

      const lastIndex = orderedNodes.length - 1;

      const targetIndex =
        action === 'bring-to-front'
          ? lastIndex
          : action === 'bring-forward'
            ? Math.min(currentIndex + 1, lastIndex)
            : action === 'send-backward'
              ? Math.max(currentIndex - 1, 0)
              : 0;

      if (targetIndex === currentIndex) {
        return state;
      }

      const reorderedNodes = [...orderedNodes];
      const [movedNode] = reorderedNodes.splice(currentIndex, 1);

      reorderedNodes.splice(targetIndex, 0, movedNode);

      return {
        ...recordContentChange(state.nodes, state.edges, state.undoStack),
        nodes: normalizeNodeLayers(reorderedNodes),
        ...dirtyState(state),
      };
    }),

  setActiveConnectionType: (connectionType) =>
    set({
      activeConnectionType: connectionType,
    }),

  copySelection: () =>
    set((state) => {
      const selectedNodes = state.nodes.filter((node) => node.selected);

      if (selectedNodes.length === 0) {
        return state;
      }

      const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));

      const selectedEdges = state.edges.filter(
        (edge) =>
          selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
      );

      return {
        clipboard: structuredClone({
          nodes: selectedNodes,
          edges: selectedEdges,
        }),
      };
    }),

  pasteClipboard: () =>
    set((state) => {
      if (!state.clipboard || state.clipboard.nodes.length === 0) {
        return state;
      }

      const nodeIdMap = new Map<string, string>();

      const pastedNodes: EditorNode[] = state.clipboard.nodes.map((node) => {
        const newNodeId = crypto.randomUUID();

        nodeIdMap.set(node.id, newNodeId);

        return {
          ...structuredClone(node),
          id: newNodeId,
          position: {
            x: node.position.x + PASTE_OFFSET,
            y: node.position.y + PASTE_OFFSET,
          },
          selected: true,
        };
      });

      const pastedEdges: EditorEdge[] = state.clipboard.edges.flatMap(
        (edge) => {
          const source = nodeIdMap.get(edge.source);
          const target = nodeIdMap.get(edge.target);

          if (!source || !target) {
            return [];
          }

          return [
            {
              ...structuredClone(edge),
              id: crypto.randomUUID(),
              source,
              target,
              selected: true,
            },
          ];
        },
      );

      return {
        ...recordContentChange(state.nodes, state.edges, state.undoStack),
        nodes: [
          ...state.nodes.map((node) => ({ ...node, selected: false })),
          ...pastedNodes,
        ],
        edges: [
          ...state.edges.map((edge) => ({ ...edge, selected: false })),
          ...pastedEdges,
        ],
        clipboard: structuredClone({
          nodes: pastedNodes,
          edges: pastedEdges,
        }),
        ...dirtyState(state),
      };
    }),

  setSaveError: (saveError) => set({ saveError }),
}));

// UI selection and camera changes are local; only content becomes an operation.
useEditorStore.subscribe((state, previous) => {
  if (
    state.sessionId !== previous.sessionId ||
    state.editRevision === previous.editRevision
  )
    return;
  const changes = diffDiagramSnapshots(
    {
      nodes: previous.nodes,
      edges: previous.edges,
      viewport: previous.viewport,
    },
    { nodes: state.nodes, edges: state.edges, viewport: state.viewport },
  );
  const operations: DiagramOperation[] = [];
  for (let index = 0; index < changes.length; index += 500) {
    operations.push({
      id: crypto.randomUUID(),
      changes: changes.slice(index, index + 500),
    });
  }
  useEditorStore.setState({
    pendingOperations: [...state.pendingOperations, ...operations],
    isDirty: state.pendingOperations.length + operations.length > 0,
  });
});
