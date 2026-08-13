import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from '@xyflow/react';
import './editor-page.css';
import { Plus } from 'lucide-react';

export const EditorPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) => addEdge(connection, currentEdges));
    },
    [setEdges],
  );

  const onAddNode = useCallback(() => {
    setNodes((currentNodes) => {
      const nodeIndex = currentNodes.length;
      const newNode: Node = {
        id: crypto.randomUUID(),
        position: {
          x: 80 + (nodeIndex % 4) * 180,
          y: 80 + Math.floor(nodeIndex / 4) * 100,
        },
        data: {
          label: `Node ${nodeIndex + 1}`,
        },
      };

      return [...currentNodes, newNode];
    });
  }, [setNodes]);

  return (
    <main className="editor-page">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Panel position="top-left" className="editor-toolbar">
          <button
            type="button"
            className="editor-toolbar__button"
            onClick={onAddNode}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Add node</span>
          </button>
        </Panel>
        <Background />
        <Controls />
      </ReactFlow>
    </main>
  );
};

export default EditorPage;
