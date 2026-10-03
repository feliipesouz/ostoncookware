import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "./client.js";
import { catalogColors, cookwareItemsIncluded, cookwareSpecifications } from "./catalog-data.js";

const publish = process.argv.includes("--publish");
const status = publish ? "PUBLISHED" : "DRAFT";
const publicDirectory = resolve(import.meta.dirname, "../../../apps/web/public");
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!configuredSiteUrl) throw new Error("Defina NEXT_PUBLIC_SITE_URL antes de importar o catálogo.");
const siteUrl = new URL(configuredSiteUrl);
if (!/^https?:$/.test(siteUrl.protocol) || siteUrl.username || siteUrl.password) {
  throw new Error("NEXT_PUBLIC_SITE_URL deve ser uma URL http(s) pública sem credenciais.");
}

async function asset(name: string, alt: string, width: number, height: number) {
  const pathname = `/catalogo/${name}.webp`;
  const file = await stat(resolve(publicDirectory, pathname.slice(1)));
  return prisma.mediaAsset.upsert({
    where: { pathname },
    create: {
      id: `oston_catalog_${name}`,
      url: new URL(pathname, siteUrl).href,
      pathname,
      originalFilename: `${name}.webp`,
      alt,
      width,
      height,
      size: file.size,
      mimeType: "image/webp",
      type: "IMAGE",
      tags: ["catalogo-oston", "2026-09-27"],
    },
    update: {},
  });
}

async function seedCatalog() {
  const accessories = await asset("oston-acessorios", "Avental, luvas, utensílios e descansos dos conjuntos OSTON", 900, 1600);
  const catalogAccessories = await asset("catalogo-acessorios", "Página do catálogo com os acessórios incluídos", 1146, 1492);
  const pages = new Map<string, string>();
  for (const [name, width, height] of [
    ["catalogo-os18-os19", 2048, 1451],
    ["catalogo-os20-os21", 2048, 1358],
    ["catalogo-os22-os23", 2048, 1377],
  ] as const) {
    const media = await asset(name, "Página do catálogo OSTON: conjuntos e capacidades", width, height);
    pages.set(name, media.id);
  }

  let created = 0;
  for (const [index, color] of catalogColors.entries()) {
    const photo = await asset(color.image, `Conjunto de panelas OSTON ${color.name} ${color.code}, fotografado no showroom`, 900, 1600);
    const collectionId = `oston_collection_${color.slug}`;
    const productSlug = `conjunto-${color.slug}-20-pecas`;
    const existing = await prisma.collection.findUnique({ where: { slug: color.slug } });
    if (existing && existing.id !== collectionId) {
      throw new Error(`O slug ${color.slug} já pertence a uma coleção diferente. Nenhum conteúdo existente será substituído.`);
    }
    const existingProduct = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (existingProduct) {
      if (existingProduct.id !== `oston_product_${color.slug}` || existingProduct.sku !== color.code) {
        throw new Error(`O slug ${productSlug} já pertence a um produto diferente. Nenhum conteúdo existente será substituído.`);
      }
      console.info(`${color.code}: já cadastrado; conteúdo e estado editorial preservados.`);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.upsert({
        where: { slug: color.slug },
        create: {
          id: collectionId,
          slug: color.slug,
          name: color.name,
          shortDescription: color.description,
          description: `Conheça o conjunto OSTON ${color.name}: panelas, tampas e acessórios em uma composição de 20 peças. ${color.description}`,
          coverImageId: photo.id,
          featured: true,
          status,
          sortOrder: index,
          isDemo: false,
          seoTitle: `Panelas OSTON ${color.name} — conjunto de 20 peças`,
          seoDescription: `Conheça o conjunto de panelas OSTON ${color.name} ${color.code}, com 20 peças e acessórios. Veja fotos, medidas, capacidades e solicite atendimento.`,
          images: { create: [{ mediaId: photo.id, sortOrder: 0 }, { mediaId: accessories.id, sortOrder: 1 }] },
        },
        update: {},
      });
      const imageIds = [photo.id, accessories.id, pages.get(color.page)!, catalogAccessories.id];
      const product = await tx.product.create({ data: {
        id: `oston_product_${color.slug}`,
        collectionId: collection.id,
        name: `Conjunto ${color.name} · 20 peças`,
        slug: productSlug,
        sku: color.code,
        shortDescription: `${color.description} Conjunto com 20 peças e acessórios.`,
        description: `O conjunto de panelas OSTON ${color.name} reúne uma frigideira, uma panela e três caçarolas com tampas, além dos acessórios de cozinha apresentados no catálogo.\n\n${color.description} Explore a composição, confira as capacidades de cada peça e converse com a OSTON para consultar valores e condições.`,
        specifications: [{ label: "Código", value: color.code }, { label: "Cor", value: color.name }, ...cookwareSpecifications],
        features: ["20 peças com acessórios", "Cinco tamanhos de 16 a 32 cm", "Capacidades de 1,3 a 6,5 litros"],
        itemsIncluded: cookwareItemsIncluded,
        details: { materials: [], compatibilities: [], care: [] },
        price: null,
        availability: "AVAILABLE",
        featured: true,
        status,
        sortOrder: index,
        isDemo: false,
        seoTitle: `Conjunto de panelas OSTON ${color.name} ${color.code} — 20 peças`,
        seoDescription: `Veja fotos e a composição do conjunto OSTON ${color.name}: frigideira, panela, três caçarolas e acessórios. Consulte valores com a OSTON.`,
        images: { create: imageIds.map((mediaId, sortOrder) => ({ mediaId, sortOrder })) },
      }});
      await tx.auditLog.create({ data: {
        action: "IMPORT", entity: "Product", entityId: product.id,
        metadata: { source: "owner-supplied-catalog-2026-09-27", sku: color.code, status },
      }});
    });
    created += 1;
  }
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default", brandName: "OSTON Cookware", tagline: "O extraordinário começa à mesa.",
      defaultSeoTitle: "OSTON Cookware — conjuntos de panelas e acessórios",
      defaultSeoDescription: "Descubra os conjuntos de panelas OSTON em seis cores. Veja a composição das 20 peças, confira fotos e fale com o atendimento.",
      footerText: "Panelas, encontros e tudo o que faz parte da sua cozinha.",
      copyrightText: "OSTON Cookware. Todos os direitos reservados.",
    },
    update: {},
  });
  console.info(`Catálogo: ${created} conjuntos criados em ${status}; itens já existentes preservados.`);
  console.info("Valores, estoque, materiais, compatibilidade e garantias devem ser mantidos no CMS conforme informações oficiais. A importação não altera configurações existentes nem limpa o cache público.");
}

seedCatalog().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha ao importar catálogo.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
