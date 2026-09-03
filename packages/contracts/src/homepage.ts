import { z } from "zod";
import { safeCtaUrlSchema } from "./url.js";

const sectionBaseSchema = z.object({
  id: z.string().min(1).max(64),
  enabled: z.boolean().default(true),
});

const differentialItemSchema = z
  .object({
    title: z.string().min(1).max(80),
    text: z.string().min(1).max(400),
  })
  .strict();

export const heroCampaignSectionSchema = sectionBaseSchema.extend({
  type: z.literal("hero_campaign"),
});

export const manifestoSectionSchema = sectionBaseSchema.extend({
  type: z.literal("manifesto"),
  eyebrow: z.string().min(1).max(80),
  quote: z.string().min(1).max(500),
  body: z.string().min(1).max(2000),
});

export const featuredCollectionsSectionSchema = sectionBaseSchema.extend({
  type: z.literal("featured_collections"),
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  ctaLabel: z.string().min(1).max(80),
  ctaHref: safeCtaUrlSchema,
});

export const differentialsSectionSchema = sectionBaseSchema.extend({
  type: z.literal("differentials"),
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  items: z.array(differentialItemSchema).min(1).max(8),
});

export const experienceSectionSchema = sectionBaseSchema.extend({
  type: z.literal("experience"),
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  body: z.string().min(1).max(2000),
  imagePath: z.string().max(240).optional(),
  imageAlt: z.string().max(180).optional(),
});

export const ambassadorSectionSchema = sectionBaseSchema.extend({
  type: z.literal("ambassador"),
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  body: z.string().min(1).max(2000),
  imagePath: z.string().max(240).optional(),
  imageAlt: z.string().max(180).optional(),
});

export const commercialCtaSectionSchema = sectionBaseSchema.extend({
  type: z.literal("commercial_cta"),
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  body: z.string().min(1).max(2000),
  primaryLabel: z.string().min(1).max(80),
  primaryHref: safeCtaUrlSchema,
  secondaryLabel: z.string().max(80).optional(),
  secondaryHref: safeCtaUrlSchema.optional(),
});

export const heroSectionSchema = sectionBaseSchema.extend({
  type: z.literal("HERO"),
  campaignId: z.string().min(1).nullable().optional(),
});

export const editorialFeatureSectionSchema = sectionBaseSchema.extend({
  type: z.literal("EDITORIAL_FEATURE"),
  eyebrow: z.string().max(80).optional(),
  title: z.string().max(180).optional(),
  body: z.string().max(2000).optional(),
  imageId: z.string().min(1).nullable().optional(),
  imagePath: z.string().max(240).optional(),
  imageAlt: z.string().max(180).optional(),
});

export const ambassadorBlockSectionSchema = sectionBaseSchema.extend({
  type: z.literal("AMBASSADOR"),
  eyebrow: z.string().max(80).optional(),
  title: z.string().max(180).optional(),
  headline: z.string().max(240).optional(),
  body: z.string().max(2000).optional(),
  imageId: z.string().min(1).nullable().optional(),
  imagePath: z.string().max(240).optional(),
  imageAlt: z.string().max(180).optional(),
});

export const brandManifestoSectionSchema = sectionBaseSchema.extend({
  type: z.literal("BRAND_MANIFESTO"),
  eyebrow: z.string().max(80),
  headline: z.string().max(240),
  body: z.string().max(4000),
});

export const featuredCollectionsBlockSchema = sectionBaseSchema.extend({
  type: z.literal("FEATURED_COLLECTIONS"),
  title: z.string().max(160),
  subtitle: z.string().max(400),
});

export const featureHighlightsSectionSchema = sectionBaseSchema.extend({
  type: z.literal("FEATURE_HIGHLIGHTS"),
  title: z.string().max(160),
  items: z.array(differentialItemSchema).max(6),
});

export const commercialCtaBlockSchema = sectionBaseSchema.extend({
  type: z.literal("COMMERCIAL_CTA"),
  eyebrow: z.string().max(80),
  headline: z.string().max(240),
  body: z.string().max(4000),
  primaryLabel: z.string().min(1).max(80),
  primaryHref: safeCtaUrlSchema,
  secondaryLabel: z.string().min(1).max(80),
  secondaryHref: safeCtaUrlSchema,
});

export const homepageSectionSchema = z.discriminatedUnion("type", [
  heroCampaignSectionSchema,
  manifestoSectionSchema,
  featuredCollectionsSectionSchema,
  differentialsSectionSchema,
  experienceSectionSchema,
  ambassadorSectionSchema,
  commercialCtaSectionSchema,
  heroSectionSchema,
  editorialFeatureSectionSchema,
  ambassadorBlockSectionSchema,
  brandManifestoSectionSchema,
  featuredCollectionsBlockSchema,
  featureHighlightsSectionSchema,
  commercialCtaBlockSchema,
]);

export const homepageSectionsSchema = z.array(homepageSectionSchema).max(16);

export const homepageWriteSchema = z
  .object({
    sections: z.array(homepageSectionSchema).max(16),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const homepageSchema = z.object({
  id: z.string(),
  sections: z.array(homepageSectionSchema),
  version: z.number().int().positive(),
  updatedAt: z.coerce.date(),
});

export type HomepageSection = z.infer<typeof homepageSectionSchema>;
export type HomepageWrite = z.infer<typeof homepageWriteSchema>;
export type Homepage = z.infer<typeof homepageSchema>;

export const defaultHomepageSections: HomepageSection[] = [
  { id: "hero", type: "hero_campaign", enabled: true },
  {
    id: "manifesto",
    type: "manifesto",
    enabled: true,
    eyebrow: "A marca",
    quote:
      "Cozinhar é um gesto de presença. A OSTON existe para que esse gesto tenha silêncio, matéria e estilo.",
    body: "Não vendemos pressa. Construímos uma marca de cookware contemporâneo, com atendimento consultivo e uma vitrine digital à altura da mesa que você imagina. O catálogo oficial entra no CMS sem reescrever o site.",
  },
  {
    id: "collections",
    type: "featured_collections",
    enabled: true,
    eyebrow: "Coleções",
    title: "Presença à mesa",
    ctaLabel: "Ver todas",
    ctaHref: "/colecoes",
  },
  {
    id: "differentials",
    type: "differentials",
    enabled: true,
    eyebrow: "A experiência OSTON",
    title: "O que permanece quando a moda passa",
    items: [
      {
        title: "Presença editorial",
        text: "Uma marca pensada para ser vista com a mesma atenção de um objeto de design.",
      },
      {
        title: "Atendimento consultivo",
        text: "Conversamos sobre a sua cozinha. Sem checkout improvisado nesta versão.",
      },
      {
        title: "Catálogo vivo",
        text: "Coleções, campanhas e embaixador são substituídos no CMS, sem depender de desenvolvedor.",
      },
      {
        title: "Conteúdo responsável",
        text: "Enquanto o catálogo oficial não chega, nada aqui se apresenta como ficha técnica real.",
      },
    ],
  },
  {
    id: "experience",
    type: "experience",
    enabled: true,
    eyebrow: "À mesa",
    title: "A cozinha como território",
    body: "Uma casa se revela na forma como recebe. A OSTON trata o cookware como objeto de convivência — visível, tátil, digno de permanecer. Este bloco é editorial e será alimentado com fotografia oficial.",
    imagePath: "/demo/experience.svg",
    imageAlt: "Composição demonstrativa da experiência OSTON à mesa",
  },
  {
    id: "ambassador",
    type: "ambassador",
    enabled: true,
    eyebrow: "Embaixador",
    title: "Uma voz ainda em reserva",
    body: "A arquitetura do site já permite trocar imagem, vídeo, headline e coleção promovida. Nenhuma personalidade real é apresentada até haver autorização e assets oficiais.",
    imagePath: "/demo/ambassador.svg",
    imageAlt: "Espaço reservado para futuro embaixador da OSTON",
  },
  {
    id: "cta",
    type: "commercial_cta",
    enabled: true,
    eyebrow: "Consultoria",
    title: "Conheça a coleção ideal para a sua cozinha",
    body: "Atendimento humano, pelo canal que preferir. Sem carrinho nesta versão — o primeiro passo é uma conversa.",
    primaryLabel: "WhatsApp",
    primaryHref: "/contato",
    secondaryLabel: "Falar com consultor",
    secondaryHref: "/contato",
  },
];
