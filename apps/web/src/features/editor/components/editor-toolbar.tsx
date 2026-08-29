import {
  Save,
  Circle,
  Diamond,
  Square,
  StickyNote,
  Triangle,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { type DiagramShapeType } from '@diagram-flow/contracts';
import { DiagramImageUploadButton } from './diagram-image-upload-button';

type ShapeTool = {
  shapeType: DiagramShapeType;
  label: string;
  icon: LucideIcon;
};

type EditorToolbarProps = {
  diagramId: string;
  isDirty: boolean;
  isSaving: boolean;
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
];

export const EditorToolbar = ({
  diagramId,
  isDirty,
  isSaving,
  onAddNode,
  onSave,
}: EditorToolbarProps) => (
  <>
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
    <button
      type="button"
      className="editor-toolbar__button"
      onClick={onSave}
      disabled={isSaving}
    >
      <Save size={18} aria-hidden="true" />
      <span>{isSaving ? 'Saving...' : 'Save'}</span>
    </button>
    <span className="editor-toolbar__status" aria-live="polite">
      {isSaving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Saved'}
    </span>
  </>
);
