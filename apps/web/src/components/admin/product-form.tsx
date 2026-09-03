"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMutate, adminPut, AdminApiError, conflictActor, conflictAt, isVersionConflict } from "@/lib/admin-client";
import { slugify } from "@/lib/admin-format";
import { NamedValueListEditor, StringListEditor } from "./list-editors";
import { MediaPicker, MediaStrip, type PickedMedia } from "./media-picker";
import { SeoPanel } from "./seo-panel";
import { ConflictBanner } from "./ui/conflict-banner";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { SaveBar } from "./ui/save-bar";
import { StatusBadge } from "./ui/status-badge";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";

type CollectionOption = { id: string; name: string };

type ProductState = {
  collectionId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  images: PickedMedia[];
  specifications: { label: string; value: string }[];
  features: string[];
  itemsIncluded: string[];
  price: string;
  availability: string;
  featured: boolean;
  status: string;
  sortOrder: number;
  isDemo: boolean;
  seoTitle: string;
  seoDescription: string;
  ogImage: PickedMedia | null;
  canonicalPath: string;
  version: number;
  updatedAt: string | null;
  updatedByName: string | null;
};

function asMedia(value: unknown): PickedMedia | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string") return null;
  return {
    id: item.id,
    url: typeof item.url === "string" ? item.url : "",
    alt: typeof item.alt === "string" ? item.alt : null,
    originalFilename: typeof item.originalFilename === "string" ? item.originalFilename : undefined,
  };
}

export function hydrateProduct(data: Record<string, unknown>): ProductState {
  const images = Array.isArray(data.images) ? data.images.map(asMedia).filter((item): item is PickedMedia => Boolean(item)) : [];
  const specs = Array.isArray(data.specifications)
    ? data.specifications.filter(
        (item): item is { label: string; value: string } =>
          typeof item === "object" && item !== null && "label" in item && "value" in item,
      )
    : [];
  return {
    collectionId: String(data.collectionId ?? ""),
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    sku: String(data.sku ?? ""),
    shortDescription: String(data.shortDescription ?? ""),
    description: String(data.description ?? ""),
    images,
    specifications: specs.map((item) => ({ label: String(item.label), value: String(item.value) })),
    features: Array.isArray(data.features) ? data.features.filter((item): item is string => typeof item === "string") : [],
    itemsIncluded: Array.isArray(data.itemsIncluded)
      ? data.itemsIncluded.filter((item): item is string => typeof item === "string")
      : [],
    price: data.price == null ? "" : String(data.price),
    availability: String(data.availability ?? "AVAILABLE"),
    featured: Boolean(data.featured),
    status: String(data.status ?? "DRAFT"),
    sortOrder: Number(data.sortOrder ?? 0),
    isDemo: Boolean(data.isDemo),
    seoTitle: String(data.seoTitle ?? ""),
    seoDescription: String(data.seoDescription ?? ""),
    ogImage: asMedia(data.ogImage),
    canonicalPath: String(data.canonicalPath ?? ""),
    version: typeof data.version === "number" && data.version > 0 ? data.version : 1,
    updatedAt: data.updatedAt ? String(data.updatedAt) : null,
    updatedByName: typeof data.updatedByName === "string" ? data.updatedByName : null,
  };
}

const emptyProduct: ProductState = {
  collectionId: "",
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  images: [],
  specifications: [],
  features: [],
  itemsIncluded: [],
  price: "",
  availability: "COMING_SOON",
  featured: false,
  status: "DRAFT",
  sortOrder: 0,
  isDemo: false,
  seoTitle: "",
  seoDescription: "",
  ogImage: null,
  canonicalPath: "",
  version: 1,
  updatedAt: null,
  updatedByName: null,
};

function buildPayload(form: ProductState, status: string) {
  return {
    collectionId: form.collectionId,
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: form.sku.trim() || null,
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim() || null,
    imageIds: form.images.map((item) => item.id),
    specifications: form.specifications.filter((item) => item.label.trim() && item.value.trim()),
    features: form.features.map((item) => item.trim()).filter(Boolean),
    itemsIncluded: form.itemsIncluded.map((item) => item.trim()).filter(Boolean),
    price: form.price.trim() || null,
    availability: form.availability,
    featured: form.featured,
    status,
    sortOrder: Number(form.sortOrder) || 0,
    isDemo: form.isDemo,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
    ogImageId: form.ogImage?.id ?? null,
    canonicalPath: form.canonicalPath.trim() || null,
    expectedVersion: form.version,
  };
}

export function ProductForm({ id, initial }: { id?: string; initial?: Record<string, unknown> }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductState>(initial ? hydrateProduct(initial) : emptyProduct);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial ? hydrateProduct(initial) : emptyProduct));
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ actorName: string; updatedAt: string | null } | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [mediaOpen, setMediaOpen] = useState(false);
  const [recordId, setRecordId] = useState(id);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);
  useUnsavedChanges(dirty);

  useEffect(() => {
    void fetch("/v1/admin/collections?pageSize=50", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setCollections(payload.data ?? []));
  }, []);

  function patch(partial: Partial<ProductState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  const save = useCallback(
    async (status: string) => {
      setSaving(true);
      setError("");
      setConflict(null);
      try {
        const payload = buildPayload(form, status);
        if (recordId) {
          const result = await adminPut<{ data: Record<string, unknown> }>(`/v1/admin/products/${recordId}`, payload);
          const next = hydrateProduct(result.data);
          setForm(next);
          setBaseline(JSON.stringify(next));
          setRecordId(String(result.data.id ?? recordId));
        } else {
          const result = await adminMutate<{ data: Record<string, unknown> }>("/v1/admin/products", "POST", payload);
          const next = hydrateProduct(result.data);
          setForm(next);
          setBaseline(JSON.stringify(next));
          setRecordId(String(result.data.id));
          router.replace(`/admin/produtos/${result.data.id}`);
        }
      } catch (err) {
        if (isVersionConflict(err)) {
          setConflict({ actorName: conflictActor(err), updatedAt: conflictAt(err) });
        } else {
          setError(err instanceof AdminApiError ? err.message : "Não foi possível salvar o produto.");
        }
      } finally {
        setSaving(false);
      }
    },
    [form, recordId, router],
  );

  useSaveHotkey(dirty, () => void save("DRAFT"));

  async function reloadCurrent() {
    if (!recordId) return;
    const response = await fetch(`/v1/admin/products/${recordId}`, { credentials: "include" });
    const payload = (await response.json()) as { data: Record<string, unknown> };
    const next = hydrateProduct(payload.data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setConflict(null);
  }

  const previewPath = `/produtos/${form.slug || "slug"}`;
  const missingAlt = form.images.some((item) => !item.alt);

  return (
    <div className="grid max-w-4xl gap-6">
      {conflict ? (
        <ConflictBanner actorName={conflict.actorName} updatedAt={conflict.updatedAt} onReload={() => void reloadCurrent()} />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <FormSection title="Informações básicas" description="Nome e texto que o consultor e o site usam para apresentar a peça.">
        <Field label="Nome">
          <input
            data-testid="product-name"
            className={fieldClass}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              patch({ name, slug: slugTouched ? form.slug : slugify(name) });
            }}
          />
        </Field>
        <Field label="Slug" hint="Usado na URL. Só minúsculas, números e hífens.">
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              patch({ slug: e.target.value });
            }}
          />
        </Field>
        <Field label="Resumo" hint="Uma ou duas frases. Aparece em cards e como fallback de SEO.">
          <textarea className={fieldClass} rows={3} value={form.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} />
        </Field>
        <Field label="Descrição">
          <textarea className={fieldClass} rows={8} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
        </Field>
      </FormSection>

      <FormSection title="Mídia" description="A primeira imagem é a capa. Reordene para definir a galeria.">
        <MediaStrip
          items={form.images}
          onRemove={(id) => patch({ images: form.images.filter((item) => item.id !== id) })}
          onReorder={(from, to) => {
            const next = [...form.images];
            const item = next.splice(from, 1)[0];
            if (!item) return;
            next.splice(to, 0, item);
            patch({ images: next });
          }}
          onAdd={() => setMediaOpen(true)}
        />
        <MediaPicker
          open={mediaOpen}
          selectedIds={form.images.map((item) => item.id)}
          onClose={() => setMediaOpen(false)}
          onSelect={(items) => patch({ images: items })}
        />
      </FormSection>

      <FormSection title="Coleção" description="Todo produto pertence a uma coleção publicada ou em rascunho.">
        <Field label="Coleção">
          <select className={fieldClass} value={form.collectionId} onChange={(e) => patch({ collectionId: e.target.value })}>
            <option value="">Selecione</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Diferenciais" description="Frases curtas sobre o que distingue esta peça. Não invente ficha técnica se o catálogo oficial ainda não chegou.">
        <StringListEditor items={form.features} onChange={(features) => patch({ features })} addLabel="Adicionar diferencial" placeholder="Ex.: Cabo forjado, equilíbrio na mão" />
      </FormSection>

      <FormSection title="Especificações" description="Pares rótulo/valor. Só o que for oficial — nada de dados demonstrativos hardcoded.">
        <NamedValueListEditor items={form.specifications} onChange={(specifications) => patch({ specifications })} />
      </FormSection>

      <FormSection title="Comercial" description="Preço, SKU e disponibilidade para o consultor. O site não tem checkout nesta versão.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU">
            <input className={fieldClass} value={form.sku} onChange={(e) => patch({ sku: e.target.value })} />
          </Field>
          <Field label="Preço" hint="Use ponto decimal, ex. 1890.00">
            <input className={fieldClass} value={form.price} onChange={(e) => patch({ price: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Disponibilidade">
            <select className={fieldClass} value={form.availability} onChange={(e) => patch({ availability: e.target.value })}>
              <option value="AVAILABLE">Disponível</option>
              <option value="UNAVAILABLE">Indisponível</option>
              <option value="COMING_SOON">Em breve</option>
            </select>
          </Field>
          <Field label="Ordem">
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.sortOrder}
              onChange={(e) => patch({ sortOrder: Number(e.target.value) })}
            />
          </Field>
        </div>
        <p className="text-sm">Itens inclusos</p>
        <StringListEditor items={form.itemsIncluded} onChange={(itemsIncluded) => patch({ itemsIncluded })} addLabel="Adicionar item" placeholder="Ex.: Tampa de vidro" />
      </FormSection>

      <SeoPanel
        seoTitle={form.seoTitle}
        seoDescription={form.seoDescription}
        canonicalPath={form.canonicalPath}
        ogImage={form.ogImage}
        fallbackTitle={form.name}
        fallbackDescription={form.shortDescription}
        previewPath={previewPath}
        missingAlt={missingAlt}
        onChange={(next) => patch(next)}
        onOgChange={(ogImage) => patch({ ogImage })}
      />

      <FormSection title="Publicação">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={form.status} />
          <span className="text-sm text-foreground-muted">versão {form.version}</span>
        </div>
        <Field label="Status">
          <select className={fieldClass} value={form.status} onChange={(e) => patch({ status: e.target.value })}>
            <option value="DRAFT">Rascunho</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => patch({ featured: e.target.checked })} />
          Destacar na vitrine
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isDemo} onChange={(e) => patch({ isDemo: e.target.checked })} />
          Conteúdo demonstrativo (não é catálogo oficial)
        </label>
        {recordId ? (
          <Link href={`/admin/produtos/${recordId}/historico`} className="text-sm underline">
            Histórico
          </Link>
        ) : null}
      </FormSection>

      <SaveBar
        dirty={dirty}
        saving={saving}
        lastSavedAt={form.updatedAt}
        status={form.status}
        onSaveDraft={() => void save("DRAFT")}
        onPublish={() => void save("PUBLISHED")}
        previewHref={
          form.slug
            ? `/api/preview?type=product&slug=${encodeURIComponent(String(form.slug))}&path=${encodeURIComponent(`/produtos/${form.slug}`)}`
            : undefined
        }
      />
    </div>
  );
}
