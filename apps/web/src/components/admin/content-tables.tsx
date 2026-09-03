"use client";

import Link from "next/link";
import { adminMutate, AdminApiError } from "@/lib/admin-client";
import { DataTable, type BulkAction } from "./ui/data-table";
import { StatusBadge } from "./ui/status-badge";

const STATUS_FILTER = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "SCHEDULED", label: "Agendado" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "ARCHIVED", label: "Arquivado" },
];

const bulk: BulkAction[] = [
  {
    id: "publish",
    label: "Publicar",
    confirmTitle: "Publicar selecionados",
    confirm: (count) => `Você está prestes a publicar ${count} ${count === 1 ? "item" : "itens"}. Eles passam a aparecer no site.`,
  },
  {
    id: "archive",
    label: "Arquivar",
    confirmTitle: "Arquivar selecionados",
    confirm: (count) => `Você está prestes a arquivar ${count} ${count === 1 ? "item" : "itens"}. Eles saem do site público até serem republicados.`,
    destructive: true,
  },
  {
    id: "feature",
    label: "Destacar",
    confirmTitle: "Destacar selecionados",
    confirm: (count) => `Marcar ${count} ${count === 1 ? "item" : "itens"} como destaque.`,
  },
];

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured?: boolean;
  collectionName?: string;
};

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured?: boolean;
};

type CampaignRow = {
  id: string;
  name: string;
  title: string;
  status: string;
  sortOrder: number;
};

export function ProductsTable({
  rows,
  meta,
  query,
}: {
  rows: ProductRow[];
  meta: { page: number; pageCount: number; total: number };
  query: Record<string, string>;
}) {
  return (
    <DataTable
      rows={rows}
      getRowId={(row) => row.id}
      pathname="/admin/produtos"
      query={query}
      meta={meta}
      sortKey={query.sort}
      sortOrder={query.order}
      searchPlaceholder="Buscar por nome ou slug…"
      filters={[{ key: "status", label: "Status", options: STATUS_FILTER }]}
      empty={{
        title: "Nenhum produto cadastrado.",
        description: "Produtos vivem dentro de uma coleção. Crie o primeiro rascunho e publique quando a ficha estiver pronta.",
        action: { label: "Criar primeiro produto", href: "/admin/produtos/novo" },
      }}
      columns={[
        {
          key: "name",
          header: "Nome",
          sortable: true,
          render: (row) => (
            <Link className="underline" href={`/admin/produtos/${row.id}`}>
              {row.name}
            </Link>
          ),
        },
        { key: "collectionName", header: "Coleção", render: (row) => row.collectionName ?? "—" },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
      ]}
      rowActions={(row) => [
        { label: "Editar", href: `/admin/produtos/${row.id}` },
        { label: "Histórico", href: `/admin/produtos/${row.id}/historico` },
        { label: "Preview", href: `/api/preview?type=product&slug=${encodeURIComponent(row.slug)}` },
      ]}
      bulkActions={bulk}
      onBulk={(action, ids) => runBulk("products", action, ids)}
    />
  );
}

export function CollectionsTable({
  rows,
  meta,
  query,
}: {
  rows: CollectionRow[];
  meta: { page: number; pageCount: number; total: number };
  query: Record<string, string>;
}) {
  return (
    <DataTable
      rows={rows}
      getRowId={(row) => row.id}
      pathname="/admin/colecoes"
      query={query}
      meta={meta}
      sortKey={query.sort}
      sortOrder={query.order}
      searchPlaceholder="Buscar coleção…"
      filters={[{ key: "status", label: "Status", options: STATUS_FILTER }]}
      empty={{
        title: "Nenhuma coleção criada.",
        description: "Coleções organizam o catálogo e alimentam a homepage. Comece por um rascunho.",
        action: { label: "Criar primeira coleção", href: "/admin/colecoes/nova" },
      }}
      columns={[
        {
          key: "name",
          header: "Nome",
          sortable: true,
          render: (row) => (
            <Link className="underline" href={`/admin/colecoes/${row.id}`}>
              {row.name}
            </Link>
          ),
        },
        { key: "slug", header: "Slug", render: (row) => row.slug },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
      ]}
      rowActions={(row) => [
        { label: "Editar", href: `/admin/colecoes/${row.id}` },
        { label: "Histórico", href: `/admin/colecoes/${row.id}/historico` },
        { label: "Preview", href: `/api/preview?type=collection&slug=${encodeURIComponent(row.slug)}` },
      ]}
      bulkActions={bulk}
      onBulk={(action, ids) => runBulk("collections", action, ids)}
    />
  );
}

export function CampaignsTable({
  rows,
  meta,
  query,
}: {
  rows: CampaignRow[];
  meta: { page: number; pageCount: number; total: number };
  query: Record<string, string>;
}) {
  return (
    <DataTable
      rows={rows}
      getRowId={(row) => row.id}
      pathname="/admin/campanhas"
      query={query}
      meta={meta}
      sortKey={query.sort}
      sortOrder={query.order}
      searchPlaceholder="Buscar campanha…"
      filters={[{ key: "status", label: "Status", options: STATUS_FILTER }]}
      empty={{
        title: "Nenhuma campanha criada. Campanhas controlam o destaque principal da homepage.",
        description: "Uma campanha publicada ou agendada vira o hero do site. Comece com um rascunho e use Preview antes de publicar.",
        action: { label: "Criar primeira campanha", href: "/admin/campanhas/nova" },
      }}
      columns={[
        {
          key: "name",
          header: "Nome interno",
          sortable: true,
          render: (row) => (
            <Link className="underline" href={`/admin/campanhas/${row.id}`}>
              {row.name}
            </Link>
          ),
        },
        { key: "title", header: "Headline", render: (row) => row.title },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
        { key: "sortOrder", header: "Ordem", sortable: true, render: (row) => row.sortOrder },
      ]}
      rowActions={(row) => [
        { label: "Editar", href: `/admin/campanhas/${row.id}` },
        { label: "Histórico", href: `/admin/campanhas/${row.id}/historico` },
        { label: "Preview", href: `/api/preview?type=campaign&id=${encodeURIComponent(row.id)}` },
      ]}
      bulkActions={bulk.filter((item) => item.id !== "feature")}
      onBulk={(action, ids) => runBulk("campaigns", action, ids)}
    />
  );
}

async function runBulk(kind: "products" | "collections" | "campaigns", action: string, ids: string[]) {
  if (kind === "products") {
    const response = await fetch("/v1/admin/products/bulk", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    if (response.ok) return;
  }
  const archivePath =
    kind === "products" ? "products" : kind === "collections" ? "collections" : "campaigns";
  for (const id of ids) {
    if (action === "archive") {
      await adminMutate(`/v1/admin/${archivePath}/${id}/archive`, "POST");
      continue;
    }
    const response = await fetch(`/v1/admin/${archivePath}/${id}`, { credentials: "include" });
    if (!response.ok) {
      throw new AdminApiError({ title: "Não foi possível carregar um item para a ação em lote." }, response.status);
    }
    const payload = (await response.json()) as { data: Record<string, unknown> };
    const data = payload.data;
    const body = toWrite(kind, data, action);
    await adminMutate(`/v1/admin/${archivePath}/${id}`, "PUT", body);
  }
}

function toWrite(kind: "products" | "collections" | "campaigns", data: Record<string, unknown>, action: string) {
  const status = action === "publish" ? "PUBLISHED" : action === "archive" ? "ARCHIVED" : String(data.status ?? "DRAFT");
  const featured = action === "feature" ? true : Boolean(data.featured);
  if (kind === "products") {
    const images = Array.isArray(data.images) ? data.images : [];
    return {
      collectionId: data.collectionId,
      name: data.name,
      slug: data.slug,
      sku: data.sku ?? null,
      shortDescription: data.shortDescription ?? null,
      description: data.description ?? null,
      imageIds: images.map((item) => (item as { id: string }).id),
      specifications: data.specifications ?? [],
      features: data.features ?? [],
      itemsIncluded: data.itemsIncluded ?? [],
      price: data.price ?? null,
      availability: data.availability,
      featured,
      status,
      sortOrder: data.sortOrder,
      isDemo: data.isDemo,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageId: (data.ogImage as { id?: string } | null)?.id ?? null,
      canonicalPath: data.canonicalPath ?? null,
      expectedVersion: data.version,
    };
  }
  if (kind === "collections") {
    const gallery = Array.isArray(data.gallery) ? data.gallery : [];
    return {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription ?? null,
      description: data.description ?? null,
      coverImageId: (data.coverImage as { id?: string } | null)?.id ?? null,
      galleryIds: gallery.map((item) => (item as { id: string }).id),
      priceFrom: data.priceFrom ?? null,
      featured,
      status,
      sortOrder: data.sortOrder,
      isDemo: data.isDemo,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageId: (data.ogImage as { id?: string } | null)?.id ?? null,
      canonicalPath: data.canonicalPath ?? null,
      expectedVersion: data.version,
    };
  }
  return {
    name: data.name,
    eyebrow: data.eyebrow ?? null,
    title: data.title,
    subtitle: data.subtitle ?? null,
    desktopImageId: (data.desktopImage as { id?: string } | null)?.id,
    mobileImageId: (data.mobileImage as { id?: string } | null)?.id,
    videoId: (data.video as { id?: string } | null)?.id ?? null,
    imageAlt: data.imageAlt,
    primaryCtaLabel: data.primaryCtaLabel,
    primaryCtaUrl: data.primaryCtaUrl,
    secondaryCtaLabel: data.secondaryCtaLabel ?? null,
    secondaryCtaUrl: data.secondaryCtaUrl ?? null,
    textAlign: data.textAlign,
    focalPosition: data.focalPosition,
    overlay: data.overlay,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    status,
    sortOrder: data.sortOrder,
    collectionId: data.collectionId ?? null,
    expectedVersion: data.version,
  };
}
