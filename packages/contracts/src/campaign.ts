import { z } from "zod";
import { expectedVersionSchema, mediaSummarySchema } from "./common.js";
import {
  campaignFocalSchema,
  campaignTextAlignSchema,
  contentStatusSchema,
} from "./enums.js";
import { safeCtaUrlSchema } from "./url.js";

export const campaignWriteSchema = z
  .object({
    name: z.string().min(2).max(120),
    eyebrow: z.string().max(80).nullable().optional(),
    title: z.string().min(2).max(180),
    subtitle: z.string().max(400).nullable().optional(),
    desktopImageId: z.string().min(1),
    mobileImageId: z.string().min(1),
    videoId: z.string().nullable().optional(),
    imageAlt: z.string().min(1).max(180),
    primaryCtaLabel: z.string().min(1).max(80),
    primaryCtaUrl: safeCtaUrlSchema,
    secondaryCtaLabel: z.string().max(80).nullable().optional(),
    secondaryCtaUrl: safeCtaUrlSchema.nullable().optional(),
    textAlign: campaignTextAlignSchema.default("left"),
    focalPosition: campaignFocalSchema.default("center"),
    overlay: z.number().min(0).max(80).default(42),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    status: contentStatusSchema.default("DRAFT"),
    sortOrder: z.number().int().min(0).default(0),
    collectionId: z.string().nullable().optional(),
    expectedVersion: expectedVersionSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: "custom",
        message: "A data final deve ser posterior à data inicial.",
        path: ["endsAt"],
      });
    }
    if (value.secondaryCtaLabel && !value.secondaryCtaUrl) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a URL do CTA secundário.",
        path: ["secondaryCtaUrl"],
      });
    }
  });

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  eyebrow: z.string().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
  desktopImage: mediaSummarySchema.nullable(),
  mobileImage: mediaSummarySchema.nullable(),
  video: mediaSummarySchema.nullable(),
  imageAlt: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaUrl: z.string(),
  secondaryCtaLabel: z.string().nullable(),
  secondaryCtaUrl: z.string().nullable(),
  textAlign: campaignTextAlignSchema,
  focalPosition: campaignFocalSchema,
  overlay: z.number(),
  startsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  status: contentStatusSchema,
  sortOrder: z.number().int(),
  collectionId: z.string().nullable(),
  version: z.number().int(),
  deletedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CampaignWrite = z.infer<typeof campaignWriteSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
