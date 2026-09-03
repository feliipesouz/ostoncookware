import type { FastifyInstance } from "fastify";
import { prisma } from "@oston/database";
import { can } from "../../lib/authz.js";
import { sendProblem } from "../../lib/errors.js";
import { humanAuditMessage } from "../../lib/audit-copy.js";
import { requireUser } from "../../lib/http.js";

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/v1/admin/dashboard", async (request, reply) => {
    try {
      await requireUser(request, "content:read");

      const last30Start = daysAgo(30);
      const prev30Start = daysAgo(60);
      const last30 = { createdAt: { gte: last30Start } };
      const prev30 = { createdAt: { gte: prev30Start, lt: last30Start } };

      const [
        leadsLast30,
        leadsPrev30,
        leadsNew,
        leadsQualified,
        leadsWon,
        bySourceRaw,
        byUtmRaw,
        byCollectionRaw,
        settings,
        collectionCount,
        publishedCampaigns,
        mediaMissingAlt,
        productsPublished,
        productsDraft,
        collectionsPublished,
        collectionsDraft,
        campaignsPublished,
        campaignsDraft,
        recentLeads,
        recentAudit,
      ] = await Promise.all([
        prisma.lead.count({ where: last30 }),
        prisma.lead.count({ where: prev30 }),
        prisma.lead.count({ where: { ...last30, status: "NEW" } }),
        prisma.lead.count({ where: { ...last30, status: "QUALIFIED" } }),
        prisma.lead.count({ where: { ...last30, status: "WON" } }),
        prisma.lead.groupBy({
          by: ["source"],
          where: last30,
          _count: { _all: true },
          orderBy: { _count: { source: "desc" } },
          take: 8,
        }),
        prisma.lead.groupBy({
          by: ["utmCampaign"],
          where: { ...last30, utmCampaign: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { utmCampaign: "desc" } },
          take: 8,
        }),
        prisma.lead.groupBy({
          by: ["collectionId"],
          where: { ...last30, collectionId: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { collectionId: "desc" } },
        }),
        prisma.siteSettings.findUnique({ where: { id: "default" } }),
        prisma.collection.count(),
        prisma.campaign.count({ where: { status: "PUBLISHED" } }),
        prisma.mediaAsset.count({
          where: { OR: [{ alt: null }, { alt: "" }] },
        }),
        prisma.product.count({ where: { status: "PUBLISHED" } }),
        prisma.product.count({ where: { status: "DRAFT" } }),
        prisma.collection.count({ where: { status: "PUBLISHED" } }),
        prisma.collection.count({ where: { status: "DRAFT" } }),
        prisma.campaign.count({ where: { status: "PUBLISHED" } }),
        prisma.campaign.count({ where: { status: "DRAFT" } }),
        prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          include: { collection: true },
        }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { actor: { select: { name: true, email: true } } },
        }),
      ]);

      const collectionIds = byCollectionRaw
        .map((row) => row.collectionId)
        .filter((id): id is string => Boolean(id));
      const collectionNames = collectionIds.length
        ? await prisma.collection.findMany({
            where: { id: { in: collectionIds } },
            select: { id: true, name: true },
          })
        : [];
      const collectionNameById = new Map(collectionNames.map((row) => [row.id, row.name]));

      const onboarding = {
        hasContact: Boolean(settings?.whatsapp || settings?.phone || settings?.email),
        hasLogo: Boolean(settings?.logoId),
        hasCollection: collectionCount > 0,
        hasPublishedCampaign: publishedCampaigns > 0,
        hasSeo: Boolean(settings?.defaultSeoTitle?.trim() && settings?.defaultSeoDescription?.trim()),
      };

      return {
        data: {
          leadsLast30,
          leadsPrev30,
          delta: leadsLast30 - leadsPrev30,
          leadsNew,
          leadsQualified,
          leadsWon,
          bySource: bySourceRaw.map((row) => ({
            source: row.source ?? "direct",
            count: row._count._all,
          })),
          byUtmCampaign: byUtmRaw.map((row) => ({
            utmCampaign: row.utmCampaign ?? "",
            count: row._count._all,
          })),
          collectionsInterest: byCollectionRaw.map((row) => ({
            collectionId: row.collectionId,
            name: row.collectionId ? (collectionNameById.get(row.collectionId) ?? "Coleção") : "Sem coleção",
            count: row._count._all,
          })),
          onboarding,
          mediaMissingAlt,
          published: {
            products: productsPublished,
            collections: collectionsPublished,
            campaigns: campaignsPublished,
          },
          draft: {
            products: productsDraft,
            collections: collectionsDraft,
            campaigns: campaignsDraft,
          },
          recentLeads: recentLeads.map((lead) => ({
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            status: lead.status,
            collectionName: lead.collection?.name ?? null,
            createdAt: lead.createdAt,
          })),
          recentAudit: recentAudit.map((item) => ({
            id: item.id,
            actorEmail: item.actorEmail,
            action: item.action,
            entity: item.entity,
            createdAt: item.createdAt,
            humanMessage: humanAuditMessage({
              action: item.action,
              entity: item.entity,
              entityId: item.entityId,
              actorName: item.actor?.name,
              actorEmail: item.actorEmail,
              metadata: (item.metadata as Record<string, unknown> | null) ?? null,
            }),
          })),
        },
      };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/search", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:read");
      const raw = (request.query as { q?: string }).q ?? "";
      const q = raw.trim();
      if (q.length < 2 || q.length > 80) {
        return { groups: [] };
      }

      const take = 6;
      const contains = { contains: q, mode: "insensitive" as const };

      const [products, collections, campaigns, leads, pages] = await Promise.all([
        prisma.product.findMany({
          where: { deletedAt: null, OR: [{ name: contains }, { slug: contains }, { sku: contains }] },
          select: { id: true, name: true, slug: true, sku: true },
          take,
        }),
        prisma.collection.findMany({
          where: { deletedAt: null, OR: [{ name: contains }, { slug: contains }] },
          select: { id: true, name: true, slug: true },
          take,
        }),
        prisma.campaign.findMany({
          where: {
            deletedAt: null,
            OR: [{ name: contains }, { title: contains }],
          },
          select: { id: true, name: true, title: true },
          take,
        }),
        can(user.role, "leads:read")
          ? prisma.lead.findMany({
              where: {
                OR: [{ name: contains }, { email: contains }, { phone: { contains: q } }],
              },
              select: { id: true, name: true, email: true, phone: true },
              take,
            })
          : Promise.resolve([]),
        prisma.page.findMany({
          where: { deletedAt: null, OR: [{ title: contains }, { slug: contains }] },
          select: { id: true, title: true, slug: true },
          take,
        }),
      ]);

      const groups = [
        {
          type: "products",
          items: products.map((item) => ({
            id: item.id,
            title: item.name,
            href: `/admin/produtos/${item.id}`,
            subtitle: item.sku ? `SKU ${item.sku}` : item.slug,
          })),
        },
        {
          type: "collections",
          items: collections.map((item) => ({
            id: item.id,
            title: item.name,
            href: `/admin/colecoes/${item.id}`,
            subtitle: item.slug,
          })),
        },
        {
          type: "campaigns",
          items: campaigns.map((item) => ({
            id: item.id,
            title: item.name,
            href: `/admin/campanhas/${item.id}`,
            subtitle: item.title,
          })),
        },
        {
          type: "leads",
          items: leads.map((item) => ({
            id: item.id,
            title: item.name,
            href: `/admin/leads/${item.id}`,
            subtitle: item.email ?? item.phone,
          })),
        },
        {
          type: "pages",
          items: pages.map((item) => ({
            id: item.id,
            title: item.title,
            href: `/admin/paginas/${item.id}`,
            subtitle: item.slug,
          })),
        },
      ].filter((group) => group.items.length > 0);

      return { groups };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}

