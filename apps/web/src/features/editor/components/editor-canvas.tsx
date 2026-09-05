import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type NodeTypes,
  ConnectionLineType,
  ConnectionMode,
} from '@xyflow/react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const EditorProperties = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="editor-properties">
      <button
        type="button"
        className="editor-toolbar__button editor-properties__toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Close properties' : 'Properties'}
      </button>
      <div
        id={panelId}
        className={`editor-properties__content${isOpen ? ' editor-properties__content--open' : ''}`}
      >
        <NodePropertiesPanel />
      </div>
    </div>
  );
};

export const EditorCanvas = ({
  diagramId,
  isDirty,
  isSaving,
  saveError,
  onSave,
}: EditorCanvasProps) => {
  const navigate = useNavigate();
  useEditorKeyboardShortcuts();
  const nodes = useEditorStore((state) => state.nodes);
  const selectedNodeIds = nodes
    .filter((node) => node.selected)
    .map((node) => node.id)
    .sort();
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
          <button
            type="button"
            className="editor-toolbar__button"
            disabled={isDirty || isSaving}
            onClick={() => navigate('/diagrams')}
            title={
              isDirty || isSaving
                ? 'Save your changes before returning to the dashboard'
                : 'Back to dashboard'
            }
          >
            Dashboard
          </button>
          <ProfileLink />
          <LogoutButton />
        </div>

        {selectedNodeIds.length > 0 && (
          <EditorProperties key={JSON.stringify(selectedNodeIds)} />
        )}
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
