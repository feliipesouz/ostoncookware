import type { HomepageSection } from "@oston/contracts";

export type { HomepageSection };

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
