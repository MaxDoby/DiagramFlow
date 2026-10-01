import { useMutation } from '@tanstack/react-query';
import { uploadDiagramImage } from '../api/editor-api';

export const useDiagramImageUpload = (diagramId: string) =>
  useMutation({
    mutationFn: (image: File) => uploadDiagramImage(diagramId, image),
  });
