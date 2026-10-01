import { ArrowRight, Spline, type LucideIcon } from 'lucide-react';
import type { DiagramConnectionType } from '@diagram-flow/contracts';
import { useEditorStore } from '../store/editor-store';

type ConnectionTool = {
  connectionType: DiagramConnectionType;
  label: string;
  icon: LucideIcon;
};

const connectionTools: ConnectionTool[] = [
  {
    connectionType: 'connector',
    label: 'Connector',
    icon: Spline,
  },
  {
    connectionType: 'arrow',
    label: 'Arrow',
    icon: ArrowRight,
  },
];

export const ConnectionTypeSelector = () => {
  const activeConnectionType = useEditorStore(
    (state) => state.activeConnectionType,
  );

  const setActiveConnectionType = useEditorStore(
    (state) => state.setActiveConnectionType,
  );

  return (
    <div
      className="editor-toolbar__connection-tools"
      role="group"
      aria-label="Connection type"
    >
      {connectionTools.map(({ connectionType, label, icon: Icon }) => {
        const isActive = activeConnectionType === connectionType;

        return (
          <button
            key={connectionType}
            type="button"
            className={[
              'editor-toolbar__connection-button',
              isActive ? 'editor-toolbar__connection-button--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setActiveConnectionType(connectionType)}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};
