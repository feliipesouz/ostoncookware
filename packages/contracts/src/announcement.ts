import { z } from "zod";
import { safeCtaUrlSchema } from "./url.js";

export const announcementWriteSchema = z
  .object({
    message: z.string().min(1).max(240),
    ctaLabel: z.string().max(80).nullable().optional(),
    ctaUrl: safeCtaUrlSchema.nullable().optional(),
    active: z.boolean().default(false),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
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
    if (value.ctaLabel && !value.ctaUrl) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a URL do anúncio.",
        path: ["ctaUrl"],
      });
    }
  });

export const announcementSchema = z.object({
  id: z.string(),
  message: z.string(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  active: z.boolean(),
  startsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AnnouncementWrite = z.infer<typeof announcementWriteSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
