import * as z from 'zod';

const diagramNameSchema = z.string().trim().min(1).max(150);

export const createDiagramSchema = z.object({
  name: diagramNameSchema,
  folderId: z.uuid().optional(),
});

export type CreateDiagramInput = z.infer<typeof createDiagramSchema>;

export const updateDiagramSchema = z
  .object({
    name: diagramNameSchema.optional(),
    folderId: z.uuid().nullable().optional(),
  })
  .refine((input) => input.name !== undefined || input.folderId !== undefined, {
    message: 'At least one field is required.',
  });

export type UpdateDiagramInput = z.infer<typeof updateDiagramSchema>;

const diagramNodeSchema = z
  .object({
    id: z.string().min(1),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z.record(z.string(), z.json()),
  })
  .catchall(z.json());

const diagramEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .catchall(z.json());

const diagramViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
});

export const diagramSnapshotSchema = z.object({
  nodes: z.array(diagramNodeSchema).default([]),
  edges: z.array(diagramEdgeSchema).default([]),
  viewport: diagramViewportSchema.default({
    x: 0,
    y: 0,
    zoom: 1,
  }),
});

export type DiagramSnapshot = z.infer<typeof diagramSnapshotSchema>;

export const saveDiagramSnapshotSchema = z.object({
  snapshot: diagramSnapshotSchema,
  expectedVersion: z.int().nonnegative(),
});

export type SaveDiagramSnapshotInput = z.infer<
  typeof saveDiagramSnapshotSchema
>;

export const saveDiagramSnapshotResponseSchema = z.object({
  version: z.int().nonnegative(),

  updatedAt: z.iso.datetime(),
});

export type SaveDiagramSnapshotResponse = z.infer<
  typeof saveDiagramSnapshotResponseSchema
>;

export const diagramParamsSchema = z.object({
  diagramId: z.uuid(),
});

export const diagramListQuerySchema = z.object({
  folderId: z.uuid().optional(),
});

export type DiagramListQuery = z.infer<typeof diagramListQuerySchema>;

export type DiagramParams = z.infer<typeof diagramParamsSchema>;

export const diagramSummaryResponseSchema = z.object({
  id: z.uuid(),
  name: diagramNameSchema,
  folderId: z.uuid().nullable(),
  version: z.int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type DiagramSummaryResponse = z.infer<
  typeof diagramSummaryResponseSchema
>;

export const diagramDetailsResponseSchema = diagramSummaryResponseSchema.extend(
  { snapshot: diagramSnapshotSchema },
);

export type DiagramDetailsResponse = z.infer<
  typeof diagramDetailsResponseSchema
>;

export const diagramListResponseSchema = z.array(diagramSummaryResponseSchema);
export type DiagramListResponse = z.infer<typeof diagramListResponseSchema>;
