import { z } from "zod";
import { safeCtaUrlSchema } from "./url.js";
import { campaignFocalSchema, campaignTextAlignSchema } from "./enums.js";

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

// Brand content belongs to the homepage, independently of a campaign's lifecycle.
export const brandHeroSectionSchema = sectionBaseSchema.extend({
  type: z.literal("BRAND_HERO"),
  eyebrow: z.string().max(80),
  title: z.string().trim().min(1).max(180),
  subtitle: z.string().max(400),
  desktopImageId: z.string().min(1).nullable().optional(),
  mobileImageId: z.string().min(1).nullable().optional(),
  imageAlt: z.string().trim().min(1).max(180),
  primaryCtaLabel: z.string().trim().min(1).max(80),
  primaryCtaUrl: safeCtaUrlSchema,
  secondaryCtaLabel: z.string().max(80).optional(),
  secondaryCtaUrl: safeCtaUrlSchema.optional(),
  textAlign: campaignTextAlignSchema.default("left"),
  focalPosition: campaignFocalSchema.default("center"),
  overlay: z.number().int().min(0).max(80).default(42),
});

export const seasonalCampaignSectionSchema = sectionBaseSchema.extend({
  type: z.literal("SEASONAL_CAMPAIGN"),
  campaignId: z.string().min(1).nullable().optional(),
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

const setCompositionPieceSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(80),
    diameter: z.string().trim().min(1).max(40),
    capacity: z.string().trim().min(1).max(40),
  })
  .strict();

export const setCompositionSectionSchema = sectionBaseSchema.extend({
  type: z.literal("SET_COMPOSITION"),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(1000),
  imageId: z.string().min(1).nullable().optional(),
  imagePath: z.string().max(240).optional(),
  imageAlt: z.string().trim().min(1).max(180),
  pieces: z.array(setCompositionPieceSchema).min(1).max(8),
  accessoriesTitle: z.string().trim().min(1).max(120),
  accessories: z.array(z.string().trim().min(1).max(160)).min(1).max(12),
  ctaLabel: z.string().trim().min(1).max(80),
  ctaHref: safeCtaUrlSchema,
});

const purchaseGuideStepSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    text: z.string().trim().min(1).max(500),
  })
  .strict();

const purchaseGuideFaqSchema = z
  .object({
    question: z.string().trim().min(1).max(180),
    answer: z.string().trim().min(1).max(1000),
  })
  .strict();

export const purchaseGuideSectionSchema = sectionBaseSchema.extend({
  type: z.literal("PURCHASE_GUIDE"),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(1000),
  steps: z.array(purchaseGuideStepSchema).length(3),
  faqTitle: z.string().trim().min(1).max(180),
  faqs: z.array(purchaseGuideFaqSchema).min(1).max(8),
  ctaLabel: z.string().trim().min(1).max(80),
  ctaHref: safeCtaUrlSchema,
});

export const homepageSectionSchema = z.discriminatedUnion("type", [
  brandHeroSectionSchema,
  seasonalCampaignSectionSchema,
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
  setCompositionSectionSchema,
  purchaseGuideSectionSchema,
]);

export const homepageSectionsSchema = z.array(homepageSectionSchema).max(20);

const homepageWritableSectionsSchema = homepageSectionsSchema.superRefine((sections, ctx) => {
  const ids = new Set<string>();
  for (const [index, section] of sections.entries()) {
    if (ids.has(section.id)) {
      ctx.addIssue({
        code: "custom",
        message: "Cada seção deve ter um identificador único.",
        path: [index, "id"],
      });
    }
    ids.add(section.id);
    if (
      section.type === "BRAND_HERO" &&
      Boolean(section.secondaryCtaLabel) !== Boolean(section.secondaryCtaUrl)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Preencha o texto e o destino da chamada secundária.",
        path: [index, "secondaryCtaLabel"],
      });
    }
    if (section.type === "SET_COMPOSITION") {
      const pieceIds = new Set<string>();
      section.pieces.forEach((piece, pieceIndex) => {
        if (pieceIds.has(piece.id)) {
          ctx.addIssue({
            code: "custom",
            message: "Cada peça deve ter um identificador único.",
            path: [index, "pieces", pieceIndex, "id"],
          });
        }
        pieceIds.add(piece.id);
      });
    }
  }
  if (sections.filter((section) => section.type === "BRAND_HERO").length > 1) {
    ctx.addIssue({ code: "custom", message: "A homepage deve ter apenas um hero institucional." });
  }
  const seasonalSlots = sections.filter(
    (section) =>
      section.enabled && ["SEASONAL_CAMPAIGN", "HERO", "hero_campaign"].includes(section.type),
  );
  if (seasonalSlots.length > 1) {
    ctx.addIssue({
      code: "custom",
      message: "Mantenha apenas um espaço de campanha sazonal ativo.",
    });
  }
});

export const homepageWriteSchema = z
  .object({
    sections: homepageWritableSectionsSchema,
    expectedVersion: z.number().int().positive(),
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

export const defaultBrandHeroSection: z.infer<typeof brandHeroSectionSchema> = {
  id: "brand-hero",
  type: "BRAND_HERO",
  enabled: true,
  eyebrow: "OSTON · Cookware",
  title: "O extraordinário começa à mesa.",
  subtitle:
    "Conheça as coleções OSTON e encontre as peças que fazem parte do seu jeito de cozinhar.",
  desktopImageId: null,
  mobileImageId: null,
  imageAlt: "O universo OSTON à mesa",
  primaryCtaLabel: "Explorar coleções",
  primaryCtaUrl: "/colecoes",
  secondaryCtaLabel: "Conheça a OSTON",
  secondaryCtaUrl: "/a-marca",
  textAlign: "left",
  focalPosition: "center",
  overlay: 24,
};

export const defaultSetCompositionSection: z.infer<typeof setCompositionSectionSchema> = {
  id: "set-composition",
  type: "SET_COMPOSITION",
  enabled: true,
  eyebrow: "Por dentro do conjunto",
  title: "Cada peça tem o seu lugar.",
  body: "Conheça os cinco tamanhos e suas capacidades. Os conjuntos OSTON reúnem panelas, tampas e acessórios em uma composição de 20 peças.",
  imageId: null,
  imagePath: "/catalogo/oston-os20-cappuccino.webp",
  imageAlt: "Conjunto OSTON Cappuccino com cinco recipientes e tampas sobre a bancada",
  pieces: [
    { id: "frigideira", name: "Frigideira", diameter: "32 cm", capacity: "3,7 L" },
    { id: "panela", name: "Panela", diameter: "16 cm", capacity: "1,3 L" },
    { id: "cacarola-pequena", name: "Caçarola pequena", diameter: "20 cm", capacity: "2,4 L" },
    { id: "cacarola-media", name: "Caçarola média", diameter: "24 cm", capacity: "4,3 L" },
    { id: "cacarola-grande", name: "Caçarola grande", diameter: "28 cm", capacity: "6,5 L" },
  ],
  accessoriesTitle: "Também acompanham o conjunto",
  accessories: [
    "Tampas para as cinco peças",
    "1 avental OSTON",
    "1 par de luvas térmicas",
    "1 espátula, 1 colher e 1 escumadeira",
    "5 descansos de panela",
  ],
  ctaLabel: "Explorar o catálogo",
  ctaHref: "/colecoes",
};

export const defaultPurchaseGuideSection: z.infer<typeof purchaseGuideSectionSchema> = {
  id: "purchase-guide",
  type: "PURCHASE_GUIDE",
  enabled: true,
  eyebrow: "Uma escolha bem informada",
  title: "Da sua cozinha à sua escolha.",
  body: "Explore as cores, conheça a composição e converse com a OSTON para dar o próximo passo.",
  steps: [
    {
      title: "Encontre o seu tom",
      text: "Compare as seis cores do catálogo e escolha a que combina com a sua cozinha.",
    },
    {
      title: "Conheça a composição",
      text: "Veja os tamanhos, as capacidades e os acessórios que acompanham cada conjunto.",
    },
    {
      title: "Converse com a OSTON",
      text: "Envie seu interesse para consultar valores, disponibilidade e condições com o atendimento.",
    },
  ],
  faqTitle: "Antes de escolher",
  faqs: [
    {
      question: "Quais cores estão no catálogo?",
      answer:
        "Os conjuntos são apresentados em Rosé, Creme, Cappuccino, Black Piano, Terracota e Eucalipto. Consulte o atendimento para confirmar a disponibilidade da sua escolha.",
    },
    {
      question: "O que acompanha o conjunto de 20 peças?",
      answer:
        "O catálogo reúne uma frigideira, uma panela e três caçarolas, todas com tampa, além de um avental OSTON, um par de luvas térmicas, uma espátula, uma colher, uma escumadeira e cinco descansos de panela.",
    },
    {
      question: "Onde encontro medidas e capacidades?",
      answer:
        "A composição do conjunto e as páginas de produto apresentam as medidas e capacidades de cada peça, conforme o catálogo.",
    },
    {
      question: "Como consultar valores e condições?",
      answer:
        "Escolha uma coleção ou um produto e envie seu interesse pelo formulário de contato. O atendimento da OSTON informa valores, disponibilidade e condições.",
    },
  ],
  ctaLabel: "Falar com a OSTON",
  ctaHref: "/contato",
};

/** Upgrade the read model without changing or discarding stored legacy sections. */
export function withInstitutionalHero<T extends HomepageSection>(
  sections: T[],
): (T | typeof defaultBrandHeroSection)[] {
  if (sections.some((section) => section.type === "BRAND_HERO")) return sections;
  const ids = new Set(sections.map((section) => section.id));
  let id = defaultBrandHeroSection.id;
  for (let suffix = 2; ids.has(id); suffix += 1) id = `${defaultBrandHeroSection.id}-${suffix}`;
  return [{ ...defaultBrandHeroSection, id }, ...sections];
}

export type ShoppingHomepageSection = Extract<
  HomepageSection,
  { type: "SET_COMPOSITION" | "PURCHASE_GUIDE" }
>;

/**
 * Add missing shopping sections for an explicit editor action or a one-time migration.
 * Do not call on reads: an intentionally removed section must stay removed.
 */
export function withShoppingSections<T extends HomepageSection>(
  sections: T[],
  types: readonly ShoppingHomepageSection["type"][] = ["SET_COMPOSITION", "PURCHASE_GUIDE"],
): (T | ShoppingHomepageSection)[] {
  const missing = [defaultSetCompositionSection, defaultPurchaseGuideSection].filter(
    (section) =>
      types.includes(section.type) && !sections.some((current) => current.type === section.type),
  );
  if (missing.length === 0) return sections;
  if (sections.length + missing.length > 20)
    throw new RangeError("A homepage pode ter até 20 seções.");

  const result: (T | ShoppingHomepageSection)[] = [...sections];
  const ids = new Set(sections.map((section) => section.id));
  for (const section of missing) {
    let id = section.id;
    for (let suffix = 2; ids.has(id); suffix += 1) id = `${section.id}-${suffix}`;
    ids.add(id);
    const commercialIndex = result.findIndex((current) =>
      ["COMMERCIAL_CTA", "commercial_cta"].includes(current.type),
    );
    if (section.type === "SET_COMPOSITION") {
      const collectionIndex = result.findIndex((current) =>
        ["FEATURED_COLLECTIONS", "featured_collections"].includes(current.type),
      );
      const index =
        collectionIndex >= 0
          ? collectionIndex + 1
          : commercialIndex >= 0
            ? commercialIndex
            : result.length;
      result.splice(index, 0, {
        ...section,
        id,
        pieces: section.pieces.map((piece) => ({ ...piece })),
        accessories: [...section.accessories],
      });
    } else {
      result.splice(commercialIndex >= 0 ? commercialIndex : result.length, 0, {
        ...section,
        id,
        steps: section.steps.map((step) => ({ ...step })),
        faqs: section.faqs.map((faq) => ({ ...faq })),
      });
    }
  }
  return result;
}

export function homepageMediaIds(sections: HomepageSection[]): string[] {
  return [
    ...new Set(
      sections.flatMap((section) => {
        if (section.type === "BRAND_HERO")
          return [section.desktopImageId, section.mobileImageId].filter((id): id is string =>
            Boolean(id),
          );
        return "imageId" in section && section.imageId ? [section.imageId] : [];
      }),
    ),
  ];
}

export const defaultHomepageSections: HomepageSection[] = [
  defaultBrandHeroSection,
  { id: "seasonal-campaign", type: "SEASONAL_CAMPAIGN", enabled: true, campaignId: null },
  {
    id: "collections",
    type: "featured_collections",
    enabled: true,
    eyebrow: "Coleções",
    title: "Encontre seu tom.",
    ctaLabel: "Ver todas",
    ctaHref: "/colecoes",
  },
  defaultSetCompositionSection,
  {
    id: "manifesto",
    type: "manifesto",
    enabled: true,
    eyebrow: "O prazer de estar presente",
    quote: "Mais do que cozinhar. Estar presente.",
    body: "A receita é só o começo. O que fica é o tempo à mesa, a conversa que se estende e o prazer de preparar algo para alguém. Descubra o universo OSTON.",
  },
  {
    id: "differentials",
    type: "differentials",
    enabled: true,
    eyebrow: "A experiência OSTON",
    title: "O que permanece quando a moda passa",
    items: [
      {
        title: "Encontre seu conjunto",
        text: "Explore as coleções e escolha as peças para o seu dia a dia.",
      },
      {
        title: "Conheça cada detalhe",
        text: "Consulte os itens e as características de cada conjunto antes de escolher.",
      },
      {
        title: "Converse com a OSTON",
        text: "Tire suas dúvidas sobre as coleções com o nosso atendimento.",
      },
    ],
  },
  {
    id: "experience",
    type: "experience",
    enabled: true,
    eyebrow: "À mesa",
    title: "A cozinha como território",
    body: "Da primeira escolha ao último encontro à mesa, a cozinha acompanha o seu jeito de viver.",
    imagePath: "/editorial/culinary-atmosphere.webp",
    imageAlt: "Ingredientes, ervas e linho sobre uma bancada de cozinha",
  },
  {
    id: "ambassador",
    type: "ambassador",
    enabled: false,
    eyebrow: "Embaixador",
    title: "Uma voz ainda em reserva",
    body: "A arquitetura do site já permite trocar imagem, vídeo, headline e coleção promovida. Nenhuma personalidade real é apresentada até haver autorização e assets oficiais.",
    imagePath: "/demo/ambassador.svg",
    imageAlt: "Espaço reservado para futuro embaixador da OSTON",
  },
  defaultPurchaseGuideSection,
  {
    id: "cta",
    type: "commercial_cta",
    enabled: true,
    eyebrow: "Consultoria",
    title: "Conheça a coleção ideal para a sua cozinha",
    body: "Conte como você gosta de cozinhar. Nós ajudamos você a conhecer as opções.",
    primaryLabel: "Falar com a OSTON",
    primaryHref: "/contato",
    secondaryLabel: "Falar com consultor",
    secondaryHref: "/contato",
  },
];
