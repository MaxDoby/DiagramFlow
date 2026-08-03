import * as z from 'zod';

const folderNameSchema = z.string().trim().min(1).max(100);

export const createFolderSchema = z.object({
  name: folderNameSchema,
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  name: folderNameSchema,
});

export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

export const folderParamsSchema = z.object({
  folderId: z.uuid(),
});

export type FolderParams = z.infer<typeof folderParamsSchema>;

export const folderResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  diagramCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type FolderResponse = z.infer<typeof folderResponseSchema>;

export const folderListResponseSchema = z.array(folderResponseSchema);

export type FolderListResponse = z.infer<typeof folderListResponseSchema>;
