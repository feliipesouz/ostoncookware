import { z } from "zod";
import { expectedVersionSchema, slugSchema } from "./common.js";
import { contentStatusSchema } from "./enums.js";

export const pageWriteSchema = z
  .object({
    slug: slugSchema,
    title: z.string().min(2).max(180),
    eyebrow: z.string().max(80).nullable().optional(),
    body: z.string().min(1).max(20000),
    status: contentStatusSchema.default("DRAFT"),
    seoTitle: z.string().max(70).nullable().optional(),
    seoDescription: z.string().max(320).nullable().optional(),
    ogImageId: z.string().nullable().optional(),
    canonicalPath: z
      .string()
      .max(240)
      .regex(/^\/[a-zA-Z0-9/_-]*$/, "Caminho canônico inválido.")
      .nullable()
      .optional(),
    expectedVersion: expectedVersionSchema,
  })
  .strict();

export const pageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  eyebrow: z.string().nullable(),
  body: z.string(),
  status: contentStatusSchema,
  version: z.number().int(),
  deletedAt: z.coerce.date().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  ogImageId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const defaultBrandPage = {
  slug: "a-marca",
  title: "Cozinhando com qualidade e estilo",
  eyebrow: "A marca",
  body: "A OSTON nasce como uma marca de cookware contemporâneo: silenciosa na comunicação, precisa no gesto, sofisticada na presença. Esta página conta a intenção da marca — não um dossiê técnico.\n\nO modelo comercial é consultivo. O site apresenta coleções, captura interesse e prepara o terreno para um embaixador oficial, quando o cliente autorizar imagem e nome.\n\nEspecificações, origem, materiais e preços entram apenas com o catálogo oficial.",
  status: "PUBLISHED" as const,
  seoTitle: "A marca | OSTON Cookware",
  seoDescription: "OSTON Cookware. Cozinhando com qualidade e estilo.",
};

export type PageWrite = z.infer<typeof pageWriteSchema>;
export type Page = z.infer<typeof pageSchema>;
