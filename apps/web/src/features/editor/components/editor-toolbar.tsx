import {
  Save,
  Circle,
  Diamond,
  Square,
  StickyNote,
  Triangle,
  Type,
  PanelsTopLeft,
  type LucideIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { type DiagramShapeType } from '@diagram-flow/contracts';
import { DiagramImageUploadButton } from './diagram-image-upload-button';
import { ConnectionTypeSelector } from './connection-type-selector';

type ShapeTool = {
  shapeType: DiagramShapeType;
  label: string;
  icon: LucideIcon;
};

type EditorToolbarProps = {
  diagramId: string;
  isDirty: boolean;
  isSaving: boolean;
  hasSaveConflict: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddNode: (shapeType: DiagramShapeType) => void;
  onSave: () => void;
};

const shapeTools: ShapeTool[] = [
  { shapeType: 'rectangle', label: 'Rectangle', icon: Square },
  { shapeType: 'circle', label: 'Circle', icon: Circle },
  { shapeType: 'diamond', label: 'Diamond', icon: Diamond },
  { shapeType: 'triangle', label: 'Triangle', icon: Triangle },
  { shapeType: 'text', label: 'Text', icon: Type },
  { shapeType: 'sticky-note', label: 'Sticky note', icon: StickyNote },
  { shapeType: 'container', label: 'Container', icon: PanelsTopLeft },
];

export const EditorToolbar = ({
  diagramId,
  isDirty,
  isSaving,
  hasSaveConflict,
  canUndo,
  canRedo,
  onRedo,
  onUndo,
  onAddNode,
  onSave,
}: EditorToolbarProps) => (
  <>
    <button
      type="button"
      className="editor-toolbar__button"
      onClick={onUndo}
      disabled={!canUndo}
      aria-label="Undo"
      title="Undo (Ctrl/Cmd + Z)"
    >
      <Undo2 size={18} aria-hidden="true" />
    </button>

    <button
      type="button"
      className="editor-toolbar__button"
      onClick={onRedo}
      disabled={!canRedo}
      aria-label="Redo"
      title="Redo (Ctrl/Cmd + Shift + Z)"
    >
      <Redo2 size={18} aria-hidden="true" />
    </button>
    {shapeTools.map(({ shapeType, label, icon: Icon }) => (
      <button
        key={shapeType}
        type="button"
        className="editor-toolbar__button"
        onClick={() => onAddNode(shapeType)}
        aria-label={`Add ${label}`}
        title={`Add ${label}`}
      >
        <Icon size={18} aria-hidden="true" />
      </button>
    ))}
    <DiagramImageUploadButton diagramId={diagramId} />
    <ConnectionTypeSelector />
    <button
      type="button"
      className="editor-toolbar__button"
      onClick={onSave}
      disabled={isSaving || hasSaveConflict}
    >
      <Save size={18} aria-hidden="true" />
      <span>{isSaving ? 'Saving...' : 'Save'}</span>
    </button>
    <span className="editor-toolbar__status" aria-live="polite">
      {isSaving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Saved'}
    </span>
  </>
);
