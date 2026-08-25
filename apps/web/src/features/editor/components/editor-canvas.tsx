import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { LogoutButton } from '../../auth/components/logout-button';
import { ProfileLink } from '../../profile/components/profile-link';
import { useEditorStore } from '../store/editor-store';
import { EditorToolbar } from './editor-toolbar';
import { EditorShapeNode } from './nodes/editor-shape-node';

type EditorCanvasProps = {
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: () => void;
};

const nodeTypes = {
  shape: EditorShapeNode,
} satisfies NodeTypes;

export const EditorCanvas = ({
  isDirty,
  isSaving,
  saveError,
  onSave,
}: EditorCanvasProps) => {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const viewport = useEditorStore((state) => state.viewport);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const onConnect = useEditorStore((state) => state.onConnect);
  const onMoveEnd = useEditorStore((state) => state.onMoveEnd);
  const addNode = useEditorStore((state) => state.addNode);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      defaultViewport={viewport}
      onMoveEnd={onMoveEnd}
      nodeTypes={nodeTypes}
    >
      <Panel position="top-left" className="editor-toolbar">
        <EditorToolbar
          isDirty={isDirty}
          isSaving={isSaving}
          onAddNode={addNode}
          onSave={onSave}
        />
      </Panel>

      <Panel position="top-right" className="flex gap-2">
        <ProfileLink />
        <LogoutButton />
      </Panel>

      {saveError ? (
        <Panel position="top-center">
          <p role="alert">{saveError}</p>
        </Panel>
      ) : null}

      <Background />
      <Controls />
    </ReactFlow>
  );
};
