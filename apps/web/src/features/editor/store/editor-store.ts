import {
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
} from '@xyflow/react';
import { create } from 'zustand';

export type EditorNode = DiagramSnapshot['nodes'][number];
export type EditorEdge = DiagramSnapshot['edges'][number];

type EditorStore = {
  nodes: EditorNode[];
  edges: EditorEdge[];
  viewport: Viewport;
  diagramVersion: number;
  editRevision: number;
  isDirty: boolean;
  saveError: string | null;
  hydrate: (snapshot: DiagramSnapshot, version: number) => void;
  onNodesChange: (changes: NodeChange<EditorNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<EditorEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onMoveEnd: OnMoveEnd;
  addNode: (shapeType: DiagramShapeType) => void;
  markSaved: (version: number, savedRevision: number) => void;
  setSaveError: (message: string | null) => void;
};

const cleanViewport: Viewport = { x: 0, y: 0, zoom: 1 };

const defaultShapeLabels: Record<DiagramShapeType, string> = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  diamond: 'Diamond',
  triangle: 'Triangle',
  text: 'Text',
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
  'sticky-note': { width: 130, height: 100 },
};

const dirtyState = (state: EditorStore) => ({
  editRevision: state.editRevision + 1,
  isDirty: true,
  saveError: null,
});

export const useEditorStore = create<EditorStore>((set) => ({
  nodes: [],
  edges: [],
  viewport: cleanViewport,
  diagramVersion: 0,
  editRevision: 0,
  isDirty: false,
  saveError: null,

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
      edges: addEdge(connection, state.edges),
      ...dirtyState(state),
    })),

  onMoveEnd: (event, viewport) =>
    set((state) => ({
      viewport,
      ...(event ? dirtyState(state) : {}),
    })),

  addNode: (shapeType) =>
    set((state) => {
      const nodeIndex = state.nodes.length;
      const dimensions = defaultShapeDimensions[shapeType];
      const node: EditorNode = {
        id: crypto.randomUUID(),
        type: 'shape',
        position: {
          x: 80 + (nodeIndex % 4) * 180,
          y: 80 + Math.floor(nodeIndex / 4) * 100,
        },
        width: dimensions.width,
        height: dimensions.height,
        data: { label: defaultShapeLabels[shapeType], shapeType },
      };

      return {
        nodes: [...state.nodes, node],
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
