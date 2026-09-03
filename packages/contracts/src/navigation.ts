import { z } from "zod";
import { safeCtaUrlSchema } from "./url.js";

export const navigationKindSchema = z.enum(["INTERNAL", "EXTERNAL"]);

export const navigationChildSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1).max(80),
    href: safeCtaUrlSchema,
    kind: navigationKindSchema.default("INTERNAL"),
    enabled: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  })
  .strict();

export const navigationItemWriteSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1).max(80),
    href: safeCtaUrlSchema,
    kind: navigationKindSchema.default("INTERNAL"),
    enabled: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
    children: z.array(navigationChildSchema).max(12).default([]),
  })
  .strict();

export const navigationMenuKeySchema = z.enum(["header", "footer"]);

export const navigationMenuWriteSchema = z
  .object({
    key: navigationMenuKeySchema,
    name: z.string().min(1).max(80),
    items: z.array(navigationItemWriteSchema).max(12),
  })
  .strict();

export const navigationItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  kind: navigationKindSchema,
  enabled: z.boolean(),
  sortOrder: z.number().int(),
  children: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      href: z.string(),
      kind: navigationKindSchema,
      enabled: z.boolean(),
      sortOrder: z.number().int(),
    }),
  ),
});

export const navigationMenuSchema = z.object({
  id: z.string(),
  key: navigationMenuKeySchema,
  name: z.string(),
  items: z.array(navigationItemSchema),
});

export const navigationKeySchema = navigationMenuKeySchema;

export const navigationFlatItemSchema = z
  .object({
    id: z.string().optional(),
    parentId: z.string().nullable().optional(),
    label: z.string().min(1).max(80),
    href: safeCtaUrlSchema,
    kind: navigationKindSchema.default("INTERNAL"),
    enabled: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  })
  .strict();

export const navigationItemsSchema = z.array(navigationFlatItemSchema).max(24);

export const navigationWriteSchema = z
  .object({
    items: navigationItemsSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const roots = value.items.filter((item) => !item.parentId);
    if (roots.length > 12) {
      ctx.addIssue({
        code: "custom",
        message: "O menu pode ter no máximo 12 itens no primeiro nível.",
        path: ["items"],
      });
    }
    const rootIds = new Set(roots.map((item) => item.id).filter(Boolean));
    for (const [index, item] of value.items.entries()) {
      if (item.parentId && item.parentId === item.id) {
        ctx.addIssue({
          code: "custom",
          message: "Um item não pode ser pai de si mesmo.",
          path: ["items", index, "parentId"],
        });
      }
      if (item.parentId && roots.some((root) => root.parentId === item.id)) {
        ctx.addIssue({
          code: "custom",
          message: "A navegação admite apenas um nível de filhos.",
          path: ["items", index, "parentId"],
        });
      }
      if (item.parentId && item.id && rootIds.has(item.parentId) === false && !value.items.some((candidate) => candidate.id === item.parentId && !candidate.parentId)) {
        ctx.addIssue({
          code: "custom",
          message: "Filhos só podem pertencer a um item de primeiro nível.",
          path: ["items", index, "parentId"],
        });
      }
    }
  });

export const defaultHeaderNavigation = [
  { label: "A marca", href: "/a-marca", kind: "INTERNAL" as const, enabled: true, sortOrder: 0 },
  { label: "Coleções", href: "/colecoes", kind: "INTERNAL" as const, enabled: true, sortOrder: 1 },
  { label: "Contato", href: "/contato", kind: "INTERNAL" as const, enabled: true, sortOrder: 2 },
];

export const defaultFooterNavigation = [
  { label: "A marca", href: "/a-marca", kind: "INTERNAL" as const, enabled: true, sortOrder: 0 },
  { label: "Coleções", href: "/colecoes", kind: "INTERNAL" as const, enabled: true, sortOrder: 1 },
  { label: "Contato", href: "/contato", kind: "INTERNAL" as const, enabled: true, sortOrder: 2 },
];

export type NavigationKind = z.infer<typeof navigationKindSchema>;
export type NavigationKey = z.infer<typeof navigationKeySchema>;
export type NavigationItemWrite = z.infer<typeof navigationItemWriteSchema>;
export type NavigationItem = z.infer<typeof navigationFlatItemSchema>;
export type NavigationWrite = z.infer<typeof navigationWriteSchema>;
export type NavigationMenuWrite = z.infer<typeof navigationMenuWriteSchema>;
export type NavigationMenu = z.infer<typeof navigationMenuSchema>;
