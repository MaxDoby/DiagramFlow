import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  Panel,
  type Viewport,
  type OnMoveEnd,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import './editor-page.css';
import { Plus, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  getDiagram,
  DiagramApiError,
  saveDiagramSnapshot,
} from './diagram-api';
import type { DiagramSnapshot } from '@diagram-flow/contracts';

type EditorNode = DiagramSnapshot['nodes'][number];
type EditorEdge = DiagramSnapshot['edges'][number];

const AUTOSAVE_DELAY_MS = 1_000;

export const EditorPage = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState<EditorNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EditorEdge>([]);
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [diagramVersion, setDiagramVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editRevisionRef = useRef(0);
  const [isDirty, setIsDirty] = useState(false);

  const markAsDirty = useCallback(() => {
    editRevisionRef.current += 1;
    setIsDirty(true);
    setSaveError(null);
  }, []);

  const onEditorNodesChange = useCallback(
    (changes: NodeChange<EditorNode>[]) => {
      onNodesChange(changes);

      const hasPersistentChange = changes.some(
        (change) =>
          change.type === 'position' ||
          change.type === 'remove' ||
          change.type === 'add' ||
          change.type === 'replace' ||
          (change.type === 'dimensions' && change.resizing === true),
      );

      if (hasPersistentChange) {
        markAsDirty();
      }
    },
    [markAsDirty, onNodesChange],
  );

  const onEditorEdgesChange = useCallback(
    (changes: EdgeChange<EditorEdge>[]) => {
      onEdgesChange(changes);

      if (changes.some((change) => change.type !== 'select')) {
        markAsDirty();
      }
    },
    [markAsDirty, onEdgesChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      markAsDirty();
      setEdges((currentEdges) => addEdge(connection, currentEdges));
    },
    [markAsDirty, setEdges],
  );

  const onMoveEnd = useCallback<OnMoveEnd>(
    (_event, nextViewport) => {
      setViewport(nextViewport);

      if (_event) {
        markAsDirty();
      }
    },
    [markAsDirty],
  );

  const onAddNode = useCallback(() => {
    markAsDirty();
    setNodes((currentNodes) => {
      const nodeIndex = currentNodes.length;
      const newNode: EditorNode = {
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
  }, [markAsDirty, setNodes]);

  useEffect(() => {
    if (!diagramId) {
      return;
    }

    let isActive = true;

    const loadDiagram = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const diagram = await getDiagram(diagramId);

        if (!isActive) {
          return;
        }

        setNodes(diagram.snapshot.nodes);
        setEdges(diagram.snapshot.edges);
        setViewport(diagram.snapshot.viewport);
        setDiagramVersion(diagram.version);
        editRevisionRef.current = 0;
        setIsDirty(false);
      } catch {
        if (isActive) {
          setLoadError('Unable to load the diagram');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    void loadDiagram();

    return () => {
      isActive = false;
    };
  }, [diagramId, setEdges, setNodes]);

  const onSave = useCallback(async () => {
    if (!diagramId || isSaving) {
      return;
    }

    const revisionBeingSaved = editRevisionRef.current;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveDiagramSnapshot(diagramId, {
        snapshot: {
          nodes,
          edges,
          viewport,
        },
        expectedVersion: diagramVersion,
      });

      setDiagramVersion(result.version);

      if (editRevisionRef.current === revisionBeingSaved) {
        setIsDirty(false);
      }
    } catch (error: unknown) {
      if (error instanceof DiagramApiError && error.status === 409) {
        setSaveError('The diagram changed elsewhere. Reload before saving.');
      } else {
        setSaveError('Unable to save the diagram');
      }
    } finally {
      setIsSaving(false);
    }
  }, [diagramId, diagramVersion, edges, isSaving, nodes, viewport]);

  useEffect(() => {
    if (
      !diagramId ||
      !isDirty ||
      isLoading ||
      isSaving ||
      loadError ||
      saveError
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void onSave();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [diagramId, isDirty, isLoading, isSaving, loadError, onSave, saveError]);

  if (!diagramId) {
    return (
      <main className="editor-page editor-page--message">
        <p>Invalid diagram URL.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="editor-page editor-page--message">
        <p>Loading diagram...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="editor-page editor-page--message">
        <p role="alert">{loadError}</p>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onEditorNodesChange}
        onEdgesChange={onEditorEdgesChange}
        onConnect={onConnect}
        defaultViewport={viewport}
        onMoveEnd={onMoveEnd}
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
          <button
            type="button"
            className="editor-toolbar__button"
            onClick={() => void onSave()}
            disabled={isSaving}
          >
            <Save size={18} aria-hidden="true" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <span className="editor-toolbar__status" aria-live="polite">
            {isSaving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Saved'}
          </span>
        </Panel>
        {saveError ? (
          <Panel position="top-center">
            <p role="alert">{saveError}</p>
          </Panel>
        ) : null}
        <Background />
        <Controls />
      </ReactFlow>
    </main>
  );
};

export default EditorPage;
