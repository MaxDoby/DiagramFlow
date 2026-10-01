import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import { useDiagramImageUpload } from '../hooks/use-diagram-image-upload';
import { useEditorStore } from '../store/editor-store';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type DiagramImageUploadButtonProps = {
  diagramId: string;
};

export const DiagramImageUploadButton = ({
  diagramId,
}: DiagramImageUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const addImageNode = useEditorStore((state) => state.addImageNode);
  const uploadMutation = useDiagramImageUpload(diagramId);

  const openFilePicker = () => {
    setValidationError(null);
    uploadMutation.reset();
    inputRef.current?.click();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.currentTarget.files?.[0];

    event.currentTarget.value = '';

    if (!image) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      setValidationError('Select a JPG, PNG, or WebP image.');
      return;
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      setValidationError('The image must not exceed 5 MB.');
      return;
    }

    setValidationError(null);

    uploadMutation.mutate(image, {
      onSuccess: ({ imageUrl }) => {
        addImageNode(imageUrl);
      },
    });
  };

  const uploadError =
    uploadMutation.error instanceof Error ? uploadMutation.error.message : null;

  const errorMessage = validationError ?? uploadError;

  return (
    <>
      <button
        type="button"
        className="editor-toolbar__button"
        onClick={openFilePicker}
        disabled={uploadMutation.isPending}
        aria-label="Add image"
        aria-busy={uploadMutation.isPending}
        title="Add image"
      >
        <ImagePlus size={18} aria-hidden="true" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        hidden
      />

      {errorMessage ? (
        <span className="editor-toolbar__error" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </>
  );
};
