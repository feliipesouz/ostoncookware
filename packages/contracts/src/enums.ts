import { z } from "zod";

export const userRoleSchema = z.enum(["OWNER", "ADMIN", "EDITOR"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const contentStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

export const campaignTextAlignSchema = z.enum(["left", "center", "right"]);
export type CampaignTextAlign = z.infer<typeof campaignTextAlignSchema>;

export const campaignFocalSchema = z.enum([
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
]);
export type CampaignFocal = z.infer<typeof campaignFocalSchema>;

export const mediaTypeSchema = z.enum(["IMAGE", "VIDEO", "DOCUMENT"]);
export type MediaType = z.infer<typeof mediaTypeSchema>;

export const productAvailabilitySchema = z.enum(["AVAILABLE", "UNAVAILABLE", "COMING_SOON"]);
export type ProductAvailability = z.infer<typeof productAvailabilitySchema>;

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const leadInterestSchema = z.enum([
  "COLLECTION",
  "CONSULTANT",
  "CATALOG",
  "OTHER",
]);
export type LeadInterest = z.infer<typeof leadInterestSchema>;

export const auditActionSchema = z.enum([
  "CREATE",
  "UPDATE",
  "ARCHIVE",
  "PUBLISH",
  "UNPUBLISH",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "UPLOAD",
  "STATUS_CHANGE",
  "EXPORT",
  "IMPORT",
  "RESTORE",
  "ROLLBACK",
  "PREVIEW",
  "ROLE_CHANGE",
]);
export type AuditAction = z.infer<typeof auditActionSchema>;
