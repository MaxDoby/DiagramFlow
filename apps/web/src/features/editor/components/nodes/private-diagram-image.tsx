import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../../../shared/api/api-client';

export const PrivateDiagramImage = ({
  imageUrl,
  label,
}: {
  imageUrl: string;
  label: string;
}) => {
  const { diagramId } = useParams();
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);
  const key = `${diagramId}:${imageUrl}`;
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    const load = async () => {
      const fileName = imageUrl.split('/').pop();
      const response = await apiRequest(
        `/api/diagrams/${diagramId}/images/${fileName}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error('Unable to load image');
      const blob = await response.blob();
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setImage({ key, url: objectUrl });
    };
    void load().catch(() => {
      if (active) setImage(null);
    });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [diagramId, imageUrl, key]);
  return image?.key === key ? (
    <img
      className="editor-shape__image"
      src={image.url}
      alt={label}
      draggable={false}
    />
  ) : (
    <span role="img" aria-label={label}>
      Image unavailable or loading
    </span>
  );
};
