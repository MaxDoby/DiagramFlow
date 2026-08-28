import { useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';

export const useEditorKeyboardShortcuts = () => {
  const copySelection = useEditorStore((state) => state.copySelection);
  const pasteClipboard = useEditorStore((state) => state.pasteClipboard);

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
  }, [copySelection, pasteClipboard]);
};
