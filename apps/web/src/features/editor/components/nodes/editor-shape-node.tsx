import {
  Handle,
  Position,
  type NodeProps,
  type Node,
  NodeResizer,
} from '@xyflow/react';
import type { EditorNode } from '../../store/editor-store';

type ShapeNode = Node<
  Pick<EditorNode['data'], 'label' | 'shapeType' | 'imageUrl'>,
  'shape'
>;

export const EditorShapeNode = ({ data, selected }: NodeProps<ShapeNode>) => {
  const shapeType = data.shapeType ?? 'rectangle';

  return (
    <>
      <NodeResizer
        color="#0d9488"
        isVisible={selected}
        minWidth={60}
        minHeight={40}
      />
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
          id="top"
          type="source"
          position={Position.Top}
          aria-label="Top connection handle"
        />

        <Handle
          id="right"
          type="source"
          position={Position.Right}
          aria-label="Right connection handle"
        />

        <div className="editor-shape__surface">
          {shapeType === 'image' && data.imageUrl ? (
            <img
              className="editor-shape__image"
              src={data.imageUrl}
              alt={data.label}
              draggable={false}
            />
          ) : (
            <span className="editor-shape__label">{data.label}</span>
          )}
        </div>

        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          aria-label="Bottom connection handle"
        />

        <Handle
          id="left"
          type="source"
          position={Position.Left}
          aria-label="Left connection handle"
        />
      </div>
    </>
  );
};
