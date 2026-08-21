import { Plus, Save } from 'lucide-react';

type EditorToolbarProps = {
  isDirty: boolean;
  isSaving: boolean;
  onAddNode: () => void;
  onSave: () => void;
};

export const EditorToolbar = ({
  isDirty,
  isSaving,
  onAddNode,
  onSave,
}: EditorToolbarProps) => (
  <>
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
