import { diagramSnapshotSchema } from '@diagram-flow/contracts';

export const diagramImageFileNames = (snapshot: unknown): string[] => {
  const parsed = diagramSnapshotSchema.parse(snapshot);
  return [
    ...new Set(
      parsed.nodes.flatMap((node) =>
        node.data.imageUrl
          ? [node.data.imageUrl.slice('/uploads/diagram-images/'.length)]
          : [],
      ),
    ),
  ];
};
