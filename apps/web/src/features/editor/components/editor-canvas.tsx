import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type NodeTypes,
  ConnectionLineType,
  ConnectionMode,
} from '@xyflow/react';
import { LogoutButton } from '../../auth/components/logout-button';
import { ProfileLink } from '../../profile/components/profile-link';
import { useEditorStore } from '../store/editor-store';
import { EditorToolbar } from './editor-toolbar';
import { EditorShapeNode } from './nodes/editor-shape-node';
import { useEditorKeyboardShortcuts } from '../hooks/use-editor-keyboard-shortcuts';
import { NodePropertiesPanel } from './node-properties-panel';

type EditorCanvasProps = {
  diagramId: string;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: () => void;
};

const nodeTypes = {
  shape: EditorShapeNode,
} satisfies NodeTypes;

export const EditorCanvas = ({
  diagramId,
  isDirty,
  isSaving,
  saveError,
  onSave,
}: EditorCanvasProps) => {
  useEditorKeyboardShortcuts();
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const viewport = useEditorStore((state) => state.viewport);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const onConnect = useEditorStore((state) => state.onConnect);
  const onMoveEnd = useEditorStore((state) => state.onMoveEnd);
  const addNode = useEditorStore((state) => state.addNode);
  const activeConnectionType = useEditorStore(
    (state) => state.activeConnectionType,
  );

  return (
    <ReactFlow
      className={
        activeConnectionType === 'arrow' ? 'editor-canvas--arrow' : undefined
      }
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      connectionMode={ConnectionMode.Loose}
      connectionLineType={
        activeConnectionType === 'arrow'
          ? ConnectionLineType.Straight
          : ConnectionLineType.Bezier
      }
      defaultViewport={viewport}
      onMoveEnd={onMoveEnd}
      nodeTypes={nodeTypes}
      deleteKeyCode={['Backspace', 'Delete']}
    >
      <Panel position="top-left" className="editor-toolbar">
        <EditorToolbar
          diagramId={diagramId}
          isDirty={isDirty}
          isSaving={isSaving}
          onAddNode={addNode}
          onSave={onSave}
        />
      </Panel>

      <Panel position="top-right" className="editor-sidebar">
        <div className="editor-sidebar__account-actions">
          <ProfileLink />
          <LogoutButton />
        </div>

        <NodePropertiesPanel />
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
