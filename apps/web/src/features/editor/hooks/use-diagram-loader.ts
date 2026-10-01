import { useEffect, useState } from 'react';

import { getDiagram } from '../api/editor-api';
import { useEditorStore } from '../store/editor-store';

export const useDiagramLoader = (diagramId?: string) => {
  const hydrate = useEditorStore((state) => state.hydrate);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!diagramId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setLoadError(null);

    const loadDiagram = async () => {
      try {
        const diagram = await getDiagram(diagramId);

        if (isActive) {
          hydrate(diagram.snapshot, diagram.version);
        }
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
  }, [diagramId, hydrate]);

  return { isLoading, loadError };
};
