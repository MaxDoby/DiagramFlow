import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { EditorNode } from '../../store/editor-store';

type ShapeNode = Node<Pick<EditorNode['data'], 'label' | 'shapeType'>, 'shape'>;

export const EditorShapeNode = ({ data, selected }: NodeProps<ShapeNode>) => {
  const shapeType = data.shapeType ?? 'rectangle';

  return (
    <div
      className={[
        'editor-shape',
        `editor-shape--${shapeType}`,
        selected ? 'editor-shape--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        aria-label="Incoming connection"
      />

      <div className="editor-shape__surface">
        <span className="editor-shape__label">{data.label}</span>
      </div>

      <Handle
        id="source"
        type="source"
        position={Position.Right}
        aria-label="Outgoing connection"
      />
    </div>
  );
};
