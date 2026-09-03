import { prisma } from "./client.js";

const SITE_URL = process.env.WEB_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function demoUrl(path: string) {
  return `${SITE_URL.replace(/\/$/, "")}${path}`;
}

async function media(input: {
  id: string;
  file: string;
  alt: string;
  width: number;
  height: number;
  type?: "IMAGE" | "VIDEO" | "DOCUMENT";
}) {
  return prisma.mediaAsset.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      url: demoUrl(input.file),
      pathname: input.file,
      originalFilename: input.file.split("/").at(-1) ?? input.file,
      alt: input.alt,
      mimeType: "image/svg+xml",
      size: 24_000,
      width: input.width,
      height: input.height,
      type: input.type ?? "IMAGE",
    },
    update: {
      url: demoUrl(input.file),
      alt: input.alt,
    },
  });
}

async function seed() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Seed DEMO recusado em production. Use um ambiente de staging e ALLOW_DEMO_SEED=true se for intencional.",
    );
  }
  const heroDesktop = await media({
    id: "media_demo_hero_desktop",
    file: "/demo/hero-desktop.svg",
    alt: "Composição editorial da cozinha OSTON — imagem demonstrativa",
    width: 2400,
    height: 1500,
  });
  const heroMobile = await media({
    id: "media_demo_hero_mobile",
    file: "/demo/hero-mobile.svg",
    alt: "Composição editorial da cozinha OSTON em formato vertical — imagem demonstrativa",
    width: 1200,
    height: 1800,
  });
  const aurora = await media({
    id: "media_demo_aurora",
    file: "/demo/collection-aurora.svg",
    alt: "Coleção Aurora (DEMO) — composição visual substituta",
    width: 1600,
    height: 2000,
  });
  const nox = await media({
    id: "media_demo_nox",
    file: "/demo/collection-nox.svg",
    alt: "Coleção Nox (DEMO) — composição visual substituta",
    width: 1600,
    height: 2000,
  });
  const terra = await media({
    id: "media_demo_terra",
    file: "/demo/collection-terra.svg",
    alt: "Coleção Terra (DEMO) — composição visual substituta",
    width: 1600,
    height: 2000,
  });
  const experience = await media({
    id: "media_demo_experience",
    file: "/demo/experience.svg",
    alt: "Mesa posta com utensílios OSTON — imagem demonstrativa",
    width: 2000,
    height: 1400,
  });
  const chef = await media({
    id: "media_demo_chef",
    file: "/demo/ambassador.svg",
    alt: "Espaço reservado para futuro embaixador da marca — placeholder",
    width: 1600,
    height: 2000,
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      brandName: "OSTON Cookware",
      tagline: "Cozinhando com qualidade e estilo",
      whatsapp: "5500000000000",
      email: "contato@ostoncookware.com",
      instagram: "https://instagram.com/ostoncookware",
      defaultSeoTitle: "OSTON Cookware — cookware premium",
      defaultSeoDescription:
        "OSTON Cookware. Coleções de cookware com design contemporâneo, atendimento consultivo e presença digital premium.",
      defaultOgImageId: heroDesktop.id,
      footerText:
        "Atendimento consultivo. Conteúdo demonstrativo até a publicação do catálogo oficial.",
      copyrightText: "OSTON Cookware. Todos os direitos reservados.",
    },
    update: {
      brandName: "OSTON Cookware",
      tagline: "Cozinhando com qualidade e estilo",
    },
  });

  const collectionAurora = await prisma.collection.upsert({
    where: { slug: "aurora" },
    create: {
      id: "col_demo_aurora",
      name: "Aurora",
      slug: "aurora",
      shortDescription: "Linha demonstrativa de silhueta clara e presença contemporânea.",
      description:
        "A coleção Aurora é conteúdo DEMO, criado apenas para validar o layout editorial da OSTON. Substitua nome, textos e imagens pelo catálogo oficial. Nenhuma especificação técnica real é afirmada aqui.",
      coverImageId: aurora.id,
      featured: true,
      status: "PUBLISHED",
      sortOrder: 1,
      isDemo: true,
      seoTitle: "Coleção Aurora (DEMO) | OSTON Cookware",
      seoDescription: "Página demonstrativa da coleção Aurora. Conteúdo substituto até o catálogo oficial.",
    },
    update: {
      coverImageId: aurora.id,
      status: "PUBLISHED",
      featured: true,
      isDemo: true,
    },
  });

  const collectionNox = await prisma.collection.upsert({
    where: { slug: "nox" },
    create: {
      id: "col_demo_nox",
      name: "Nox",
      slug: "nox",
      shortDescription: "Linha demonstrativa de caráter noturno e contraste profundo.",
      description:
        "A coleção Nox é conteúdo DEMO. Use-a para testar o CMS, a homepage e as páginas de coleção. Não representa um produto oficial da OSTON.",
      coverImageId: nox.id,
      featured: true,
      status: "PUBLISHED",
      sortOrder: 2,
      isDemo: true,
      seoTitle: "Coleção Nox (DEMO) | OSTON Cookware",
      seoDescription: "Página demonstrativa da coleção Nox. Conteúdo substituto até o catálogo oficial.",
    },
    update: {
      coverImageId: nox.id,
      status: "PUBLISHED",
      featured: true,
      isDemo: true,
    },
  });

  const collectionTerra = await prisma.collection.upsert({
    where: { slug: "terra" },
    create: {
      id: "col_demo_terra",
      name: "Terra",
      slug: "terra",
      shortDescription: "Linha demonstrativa de paleta quente e presença mineral.",
      description:
        "A coleção Terra é conteúdo DEMO. Existe para ocupar o espaço editorial da marca até a chegada do catálogo oficial.",
      coverImageId: terra.id,
      featured: true,
      status: "PUBLISHED",
      sortOrder: 3,
      isDemo: true,
      seoTitle: "Coleção Terra (DEMO) | OSTON Cookware",
      seoDescription: "Página demonstrativa da coleção Terra. Conteúdo substituto até o catálogo oficial.",
    },
    update: {
      coverImageId: terra.id,
      status: "PUBLISHED",
      featured: true,
      isDemo: true,
    },
  });

  await prisma.collectionImage.deleteMany({
    where: { collectionId: { in: [collectionAurora.id, collectionNox.id, collectionTerra.id] } },
  });
  await prisma.collectionImage.createMany({
    data: [
      { collectionId: collectionAurora.id, mediaId: aurora.id, sortOrder: 0 },
      { collectionId: collectionAurora.id, mediaId: experience.id, sortOrder: 1 },
      { collectionId: collectionNox.id, mediaId: nox.id, sortOrder: 0 },
      { collectionId: collectionTerra.id, mediaId: terra.id, sortOrder: 0 },
    ],
  });

  await prisma.product.upsert({
    where: { slug: "aurora-conjunto" },
    create: {
      id: "prd_demo_aurora_set",
      collectionId: collectionAurora.id,
      name: "Conjunto Aurora (DEMO)",
      slug: "aurora-conjunto",
      shortDescription: "Peça demonstrativa para o layout de produto. Sem ficha técnica real.",
      description:
        "Este produto é DEMO. Não descreve camadas, materiais, garantia ou origem. Substitua pelo catálogo oficial da OSTON.",
      features: ["Conteúdo demonstrativo", "Imagens substitutas", "Pronto para o catálogo oficial"],
      itemsIncluded: ["Composição a definir no catálogo oficial"],
      specifications: [{ label: "Status", value: "Dados demonstrativos" }],
      availability: "COMING_SOON",
      featured: true,
      status: "PUBLISHED",
      sortOrder: 1,
      isDemo: true,
      seoTitle: "Conjunto Aurora (DEMO) | OSTON Cookware",
      seoDescription: "Produto demonstrativo da coleção Aurora. Sem especificações oficiais.",
    },
    update: {
      status: "PUBLISHED",
      isDemo: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: "prd_demo_aurora_set" } });
  await prisma.productImage.create({
    data: { productId: "prd_demo_aurora_set", mediaId: aurora.id, sortOrder: 0 },
  });

  await prisma.product.upsert({
    where: { slug: "nox-conjunto" },
    create: {
      id: "prd_demo_nox_set",
      collectionId: collectionNox.id,
      name: "Conjunto Nox (DEMO)",
      slug: "nox-conjunto",
      shortDescription: "Peça demonstrativa de caráter noturno. Sem dados técnicos oficiais.",
      description:
        "Produto DEMO para exercitar a navegação catálogo → produto. Será substituído pelo conteúdo real.",
      features: ["Conteúdo demonstrativo"],
      itemsIncluded: ["Composição a definir no catálogo oficial"],
      specifications: [{ label: "Status", value: "Dados demonstrativos" }],
      availability: "COMING_SOON",
      featured: true,
      status: "PUBLISHED",
      sortOrder: 1,
      isDemo: true,
    },
    update: { status: "PUBLISHED", isDemo: true },
  });
  await prisma.productImage.deleteMany({ where: { productId: "prd_demo_nox_set" } });
  await prisma.productImage.create({
    data: { productId: "prd_demo_nox_set", mediaId: nox.id, sortOrder: 0 },
  });

  await prisma.campaign.upsert({
    where: { id: "cmp_demo_hero" },
    create: {
      id: "cmp_demo_hero",
      name: "Hero inicial — DEMO",
      eyebrow: "OSTON Cookware",
      title: "Cozinhando com qualidade e estilo",
      subtitle:
        "Uma marca brasileira de cookware contemporâneo. Esta campanha é gerenciável no CMS e será substituída quando o embaixador e o catálogo oficiais forem definidos.",
      desktopImageId: heroDesktop.id,
      mobileImageId: heroMobile.id,
      imageAlt: "Campanha inicial OSTON — imagem demonstrativa",
      primaryCtaLabel: "Conhecer coleções",
      primaryCtaUrl: "/colecoes",
      secondaryCtaLabel: "Falar com consultor",
      secondaryCtaUrl: "/contato",
      textAlign: "left",
      focalPosition: "center",
      overlay: 46,
      status: "PUBLISHED",
      sortOrder: 1,
      collectionId: collectionAurora.id,
    },
    update: {
      title: "Cozinhando com qualidade e estilo",
      desktopImageId: heroDesktop.id,
      mobileImageId: heroMobile.id,
      status: "PUBLISHED",
      collectionId: collectionAurora.id,
    },
  });

  await prisma.campaign.upsert({
    where: { id: "cmp_demo_ambassador_slot" },
    create: {
      id: "cmp_demo_ambassador_slot",
      name: "Reserva de embaixador — rascunho",
      eyebrow: "Em breve",
      title: "Uma presença que cozinha com a marca",
      subtitle:
        "Estrutura pronta para receber chef ou embaixador oficial. Sem endorsement até autorização e assets do cliente.",
      desktopImageId: chef.id,
      mobileImageId: chef.id,
      imageAlt: "Placeholder para futuro embaixador OSTON",
      primaryCtaLabel: "Falar com a OSTON",
      primaryCtaUrl: "/contato",
      textAlign: "left",
      focalPosition: "center",
      overlay: 50,
      status: "DRAFT",
      sortOrder: 10,
    },
    update: {},
  });

  const homepageSections = [
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

  await prisma.homepage.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      sections: homepageSections,
      version: 1,
    },
    update: {},
  });

  const header = await prisma.navigationMenu.upsert({
    where: { key: "header" },
    create: { key: "header", name: "Cabeçalho" },
    update: { name: "Cabeçalho" },
  });
  const footer = await prisma.navigationMenu.upsert({
    where: { key: "footer" },
    create: { key: "footer", name: "Rodapé" },
    update: { name: "Rodapé" },
  });

  await prisma.navigationItem.deleteMany({ where: { menuId: { in: [header.id, footer.id] } } });
  const navLinks = [
    { label: "A marca", href: "/a-marca", sortOrder: 0 },
    { label: "Coleções", href: "/colecoes", sortOrder: 1 },
    { label: "Contato", href: "/contato", sortOrder: 2 },
  ];
  await prisma.navigationItem.createMany({
    data: [
      ...navLinks.map((item) => ({ ...item, menuId: header.id, kind: "INTERNAL", enabled: true })),
      ...navLinks.map((item) => ({ ...item, menuId: footer.id, kind: "INTERNAL", enabled: true })),
    ],
  });

  await prisma.announcement.upsert({
    where: { id: "ann_default" },
    create: {
      id: "ann_default",
      message: "Atendimento consultivo. Catálogo oficial em breve.",
      active: false,
    },
    update: {},
  });

  await prisma.page.upsert({
    where: { slug: "a-marca" },
    create: {
      slug: "a-marca",
      title: "Cozinhando com qualidade e estilo",
      eyebrow: "A marca",
      body: "A OSTON nasce como uma marca de cookware contemporâneo: silenciosa na comunicação, precisa no gesto, sofisticada na presença. Esta página conta a intenção da marca — não um dossiê técnico.\n\nO modelo comercial é consultivo. O site apresenta coleções, captura interesse e prepara o terreno para um embaixador oficial, quando o cliente autorizar imagem e nome.\n\nEspecificações, origem, materiais e preços entram apenas com o catálogo oficial.",
      status: "PUBLISHED",
      version: 1,
      seoTitle: "A marca | OSTON Cookware",
      seoDescription: "OSTON Cookware. Cozinhando com qualidade e estilo.",
    },
    update: {},
  });

  await prisma.$executeRaw`
    UPDATE "lead"
    SET
      "emailNormalized" = LOWER(TRIM("email")),
      "phoneNormalized" = REGEXP_REPLACE("phone", '\\D', '', 'g')
    WHERE "emailNormalized" IS NULL OR "phoneNormalized" IS NULL
  `;

  console.log("Seed DEMO concluído. Dados demonstrativos prontos para substituição pelo catálogo oficial.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
