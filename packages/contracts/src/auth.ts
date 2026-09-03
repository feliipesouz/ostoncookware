import { z } from "zod";
import { auditActionSchema, userRoleSchema } from "./enums.js";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  createdAt: z.coerce.date(),
});

export const adminUserRoleUpdateSchema = z
  .object({
    role: z.enum(["ADMIN", "EDITOR"]),
  })
  .strict();

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
});

export const auditLogSchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string().nullable(),
  action: auditActionSchema,
  entity: z.string(),
  entityId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
  humanMessage: z.string().optional(),
});

export const publicSiteSchema = z.object({
  settings: z.unknown(),
  campaign: z.unknown().nullable(),
  featuredCollections: z.array(z.unknown()),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
