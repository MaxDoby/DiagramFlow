import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import type { EditorNode } from '../store/editor-store';

const EXPORT_PADDING = 0.1;
const MIN_EXPORT_SIZE = 800;
const MAX_EXPORT_SIZE = 4096;

const getExportSize = (size: number) =>
  Math.min(Math.max(Math.ceil(size + 120), MIN_EXPORT_SIZE), MAX_EXPORT_SIZE);

export const exportDiagramAsPng = async (
  canvasElement: HTMLElement,
  nodes: EditorNode[],
) => {
  if (nodes.length === 0) {
    throw new Error('Add at least one element before exporting.');
  }

  const viewportElement = canvasElement.querySelector<HTMLElement>(
    '.react-flow__viewport',
  );

  if (!viewportElement) {
    throw new Error('Diagram canvas is unavailable.');
  }

  const bounds = getNodesBounds(nodes);
  const width = getExportSize(bounds.width);
  const height = getExportSize(bounds.height);
  const viewport = getViewportForBounds(
    bounds,
    width,
    height,
    0.1,
    2,
    EXPORT_PADDING,
  );

  const imageUrl = await toPng(viewportElement, {
    backgroundColor: '#ffffff',
    width,
    height,
    pixelRatio: 2,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px)
            scale(${viewport.zoom})`,
      transformOrigin: 'top left',
    },
    filter: (element) => {
      if (!(element instanceof Element)) {
        return true;
      }
      return (
        !element.classList.contains('react-flow__handle') &&
        !element.classList.contains('react-flow__resize-control')
      );
    },
  });

  const downloadLink = document.createElement('a');

  downloadLink.download = 'diagram.png';
  downloadLink.href = imageUrl;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
};
