import * as z from 'zod';

const diagramNameSchema = z.string().trim().min(1).max(150);

export const createDiagramSchema = z.object({
  name: diagramNameSchema,
  folderId: z.uuid().optional(),
});

export type CreateDiagramInput = z.infer<typeof createDiagramSchema>;

export const diagramParamsSchema = z.object({
  diagramId: z.uuid(),
});

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

export const diagramListResponseSchema = z.array(diagramSummaryResponseSchema);
export type DiagramListResponse = z.infer<typeof diagramListResponseSchema>;
