import { z } from "zod";

export const revisionEntityTypeSchema = z.enum([
  "campaign",
  "collection",
  "product",
  "homepage",
  "page",
]);

export const revisionRestoreSchema = z
  .object({
    expectedVersion: z.number().int().positive().optional(),
    changeSummary: z.string().max(240).optional(),
  })
  .strict();

export const contentRevisionSchema = z.object({
  id: z.string(),
  entityType: revisionEntityTypeSchema,
  entityId: z.string(),
  version: z.number().int().positive(),
  snapshot: z.unknown(),
  changedById: z.string().nullable(),
  changedByName: z.string().nullable().optional(),
  changeSummary: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type RevisionEntityType = z.infer<typeof revisionEntityTypeSchema>;
export type RevisionRestore = z.infer<typeof revisionRestoreSchema>;
export type ContentRevision = z.infer<typeof contentRevisionSchema>;
