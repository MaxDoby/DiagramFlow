import { useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';

export const useEditorKeyboardShortcuts = () => {
  const copySelection = useEditorStore((state) => state.copySelection);
  const pasteClipboard = useEditorStore((state) => state.pasteClipboard);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isEditableTarget) {
        return;
      }

      const hasCommandModifier = event.metaKey || event.ctrlKey;

      if (!hasCommandModifier || event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'z') {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (key === 'y' && event.ctrlKey) {
        event.preventDefault();
        redo();

        return;
      }

      if (key === 'c') {
        event.preventDefault();
        copySelection();
      }

      if (key === 'v') {
        event.preventDefault();
        pasteClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [copySelection, pasteClipboard, redo, undo]);
};
