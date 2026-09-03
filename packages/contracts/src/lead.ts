import { z } from "zod";
import { leadInterestSchema, leadStatusSchema } from "./enums.js";

export const leadCreateSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.union([z.string().email().max(254), z.literal("")]).optional(),
    phone: z.string().min(8).max(32),
    city: z.string().max(80).optional(),
    state: z.string().max(40).optional(),
    interest: leadInterestSchema.default("CONSULTANT"),
    collectionId: z.string().max(64).optional(),
    message: z.string().max(2000).optional(),
    source: z.string().max(80).optional(),
    landingPage: z.string().max(240).optional(),
    utmSource: z.string().max(120).optional(),
    utmMedium: z.string().max(120).optional(),
    utmCampaign: z.string().max(120).optional(),
    utmContent: z.string().max(120).optional(),
    website: z.string().max(200).optional(),
  })
  .strict();

export const leadStatusUpdateSchema = z
  .object({
    status: leadStatusSchema,
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const leadUpdateSchema = z
  .object({
    status: leadStatusSchema.optional(),
    assignedToId: z.string().min(1).max(64).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  })
  .strict();

export const leadNoteCreateSchema = z
  .object({
    content: z.string().trim().min(1).max(4000),
  })
  .strict();

const emptyToUndefined = z.literal("").transform(() => undefined);

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(200).optional(),
  status: z.union([leadStatusSchema, emptyToUndefined]).optional(),
  assignedToId: z.union([z.string().max(64), emptyToUndefined]).optional(),
  source: z.union([z.string().max(80), emptyToUndefined]).optional(),
  utmCampaign: z.union([z.string().max(120), emptyToUndefined]).optional(),
  collectionId: z.union([z.string().max(64), emptyToUndefined]).optional(),
  interest: z.union([leadInterestSchema, emptyToUndefined]).optional(),
  from: z.union([z.string().max(40), emptyToUndefined]).optional(),
  to: z.union([z.string().max(40), emptyToUndefined]).optional(),
  sort: z.string().max(40).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type LeadUpdate = z.infer<typeof leadUpdateSchema>;
export type LeadNoteCreate = z.infer<typeof leadNoteCreateSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
