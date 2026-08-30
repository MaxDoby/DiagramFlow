import {
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

type EditorClipboard = {
  nodes: EditorNode[];
  edges: EditorEdge[];
};

type EditorStore = {
  nodes: EditorNode[];
  edges: EditorEdge[];
  clipboard: EditorClipboard | null;
  viewport: Viewport;
  diagramVersion: number;
  editRevision: number;
  isDirty: boolean;
  saveError: string | null;
  activeConnectionType: DiagramConnectionType;
  hydrate: (snapshot: DiagramSnapshot, version: number) => void;
  onNodesChange: (changes: NodeChange<EditorNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<EditorEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onMoveEnd: OnMoveEnd;
  addNode: (shapeType: DiagramShapeType) => void;
  addImageNode: (imageUrl: string) => void;
  setActiveConnectionType: (connectionType: DiagramConnectionType) => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  markSaved: (version: number, savedRevision: number) => void;
  setSaveError: (message: string | null) => void;
};

const cleanViewport: Viewport = { x: 0, y: 0, zoom: 1 };
const PASTE_OFFSET = 32;

const defaultShapeLabels: Record<DiagramShapeType, string> = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  diamond: 'Diamond',
  triangle: 'Triangle',
  text: 'Text',
  image: 'Image',
  'sticky-note': 'Sticky note',
};

const defaultShapeDimensions: Record<
  DiagramShapeType,
  { width: number; height: number }
> = {
  rectangle: { width: 140, height: 80 },
  circle: { width: 96, height: 96 },
  diamond: { width: 112, height: 92 },
  triangle: { width: 120, height: 100 },
  text: { width: 140, height: 44 },
  image: { width: 180, height: 120 },
  'sticky-note': { width: 130, height: 100 },
};

const createEditorNode = (
  shapeType: DiagramShapeType,
  nodeIndex: number,
  imageUrl?: string,
): EditorNode => {
  const dimensions = defaultShapeDimensions[shapeType];

  return {
    id: crypto.randomUUID(),
    type: 'shape',
    position: {
      x: 80 + (nodeIndex % 4) * 180,
      y: 80 + Math.floor(nodeIndex / 4) * 100,
    },
    width: dimensions.width,
    height: dimensions.height,
    data: {
      label: defaultShapeLabels[shapeType],
      shapeType,
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
  saveError: null,
});

export const useEditorStore = create<EditorStore>((set) => ({
  nodes: [],
  edges: [],
  clipboard: null,
  viewport: cleanViewport,
  diagramVersion: 0,
  editRevision: 0,
  isDirty: false,
  saveError: null,
  activeConnectionType: 'connector',

  hydrate: (snapshot, version) =>
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      viewport: snapshot.viewport,
      diagramVersion: version,
      editRevision: 0,
      isDirty: false,
      saveError: null,
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
      edges: addEdge(
        createEditorEdge(connection, state.activeConnectionType),
        state.edges,
      ),
      ...dirtyState(state),
    })),

  onMoveEnd: (event, viewport) =>
    set((state) => ({
      viewport,
      ...(event ? dirtyState(state) : {}),
    })),

  addNode: (shapeType) =>
    set((state) => ({
      nodes: [...state.nodes, createEditorNode(shapeType, state.nodes.length)],
      ...dirtyState(state),
    })),

  addImageNode: (imageUrl) =>
    set((state) => ({
      nodes: [
        ...state.nodes,
        createEditorNode('image', state.nodes.length, imageUrl),
      ],
      ...dirtyState(state),
    })),

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

  markSaved: (version, savedRevision) =>
    set((state) => ({
      diagramVersion: version,
      ...(state.editRevision === savedRevision ? { isDirty: false } : {}),
    })),

  setSaveError: (saveError) => set({ saveError }),
}));
