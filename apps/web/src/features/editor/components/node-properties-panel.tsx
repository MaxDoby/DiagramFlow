import { type EditorNode, useEditorStore } from '../store/editor-store';

export const NodePropertiesPanel = () => {
  const nodes = useEditorStore((state) => state.nodes);
  const updateNodeData = useEditorStore((state) => state.updateNodeData);

  const selectedNodes = nodes.filter((node) => node.selected);

  if (selectedNodes.length === 0) {
    return null;
  }

  if (selectedNodes.length > 1) {
    return (
      <section
        className="node-properties-panel nodrag nowheel"
        aria-label="Node properties"
      >
        <h2 className="node-properties-panel__title">Properties</h2>
        <p className="node-properties-panel__message">
          Select a single node to edit its properties.
        </p>
      </section>
    );
  }

  const selectedNode = selectedNodes[0];

  return (
    <section
      className="node-properties-panel nodrag nowheel"
      aria-label="Node properties"
    >
      <h2 className="node-properties-panel__title">Properties</h2>

      <label className="node-properties-panel__field">
        <span>Label</span>

        <input
          className="node-properties-panel__input nodrag"
          type="text"
          value={selectedNode.data.label}
          onChange={(event) =>
            updateNodeData(selectedNode.id, {
              label: event.currentTarget.value,
            })
          }
        />
      </label>
      <div className="node-properties-panel__grid">
        <label className="node-properties-panel__field">
          <span>Background</span>

          <input
            className="node-properties-panel__color-input nodrag"
            type="color"
            value={selectedNode.data.backgroundColor}
            onChange={(event) =>
              updateNodeData(selectedNode.id, {
                backgroundColor: event.currentTarget.value,
              })
            }
          />
        </label>

        <label className="node-properties-panel__field">
          <span>Border</span>

          <input
            className="node-properties-panel__color-input nodrag"
            type="color"
            value={selectedNode.data.borderColor}
            onChange={(event) =>
              updateNodeData(selectedNode.id, {
                borderColor: event.currentTarget.value,
              })
            }
          />
        </label>
      </div>
      <label className="node-properties-panel__field node-properties-panel__field--spaced">
        <span className="node-properties-panel__field-header">
          <span>Border width</span>
          <output className="node-properties-panel__value">
            {selectedNode.data.borderWidth}px
          </output>
        </span>

        <input
          className="node-properties-panel__range nodrag"
          type="range"
          min={0}
          max={12}
          step={1}
          value={selectedNode.data.borderWidth}
          onChange={(event) =>
            updateNodeData(selectedNode.id, {
              borderWidth: event.currentTarget.valueAsNumber,
            })
          }
        />
      </label>

      <label className="node-properties-panel__field node-properties-panel__field--spaced">
        <span className="node-properties-panel__field-header">
          <span>Opacity</span>
          <output className="node-properties-panel__value">
            {Math.round(selectedNode.data.opacity * 100)}%
          </output>
        </span>

        <input
          className="node-properties-panel__range nodrag"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={selectedNode.data.opacity}
          onChange={(event) =>
            updateNodeData(selectedNode.id, {
              opacity: event.currentTarget.valueAsNumber,
            })
          }
        />
      </label>

      <label className="node-properties-panel__field node-properties-panel__field--spaced">
        <span className="node-properties-panel__field-header">
          <span>Rotation</span>
          <output className="node-properties-panel__value">
            {selectedNode.data.rotation}°
          </output>
        </span>

        <input
          className="node-properties-panel__range nodrag"
          type="range"
          min={0}
          max={359}
          step={1}
          value={selectedNode.data.rotation}
          onChange={(event) =>
            updateNodeData(selectedNode.id, {
              rotation: event.currentTarget.valueAsNumber,
            })
          }
        />
      </label>

      <div className="node-properties-panel__grid">
        <label className="node-properties-panel__field">
          <span>Font</span>

          <select
            className="node-properties-panel__input nodrag"
            value={selectedNode.data.fontFamily}
            onChange={(event) =>
              updateNodeData(selectedNode.id, {
                fontFamily: event.currentTarget
                  .value as EditorNode['data']['fontFamily'],
              })
            }
          >
            <option value="sans">Sans</option>
            <option value="serif">Serif</option>
            <option value="mono">Mono</option>
          </select>
        </label>

        <label className="node-properties-panel__field">
          <span>Text align</span>

          <select
            className="node-properties-panel__input nodrag"
            value={selectedNode.data.textAlign}
            onChange={(event) =>
              updateNodeData(selectedNode.id, {
                textAlign: event.currentTarget
                  .value as EditorNode['data']['textAlign'],
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>
    </section>
  );
};
