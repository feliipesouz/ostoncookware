"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMutate, adminPut, AdminApiError, conflictActor, conflictAt, isVersionConflict } from "@/lib/admin-client";
import { slugify } from "@/lib/admin-format";
import { MediaPicker, MediaStrip, type PickedMedia } from "./media-picker";
import { SeoPanel } from "./seo-panel";
import { ConflictBanner } from "./ui/conflict-banner";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { SaveBar } from "./ui/save-bar";
import { StatusBadge } from "./ui/status-badge";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";

type CollectionState = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  cover: PickedMedia | null;
  gallery: PickedMedia[];
  priceFrom: string;
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

export function hydrateCollection(data: Record<string, unknown>): CollectionState {
  const gallery = Array.isArray(data.gallery) ? data.gallery.map(asMedia).filter((item): item is PickedMedia => Boolean(item)) : [];
  return {
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    shortDescription: String(data.shortDescription ?? ""),
    description: String(data.description ?? ""),
    cover: asMedia(data.coverImage),
    gallery,
    priceFrom: data.priceFrom == null ? "" : String(data.priceFrom),
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

const emptyCollection: CollectionState = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  cover: null,
  gallery: [],
  priceFrom: "",
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

export function CollectionForm({ id, initial }: { id?: string; initial?: Record<string, unknown> }) {
  const router = useRouter();
  const [form, setForm] = useState<CollectionState>(initial ? hydrateCollection(initial) : emptyCollection);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial ? hydrateCollection(initial) : emptyCollection));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ actorName: string; updatedAt: string | null } | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [coverOpen, setCoverOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [recordId, setRecordId] = useState(id);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);
  useUnsavedChanges(dirty);

  function patch(partial: Partial<CollectionState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  const save = useCallback(
    async (status: string) => {
      setSaving(true);
      setError("");
      setConflict(null);
      try {
        const payload = {
          name: form.name.trim(),
          slug: form.slug.trim(),
          shortDescription: form.shortDescription.trim() || null,
          description: form.description.trim() || null,
          coverImageId: form.cover?.id ?? null,
          galleryIds: form.gallery.map((item) => item.id),
          priceFrom: form.priceFrom.trim() || null,
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
        if (recordId) {
          const result = await adminPut<{ data: Record<string, unknown> }>(`/v1/admin/collections/${recordId}`, payload);
          const next = hydrateCollection(result.data);
          setForm(next);
          setBaseline(JSON.stringify(next));
        } else {
          const result = await adminMutate<{ data: Record<string, unknown> }>("/v1/admin/collections", "POST", payload);
          const next = hydrateCollection(result.data);
          setForm(next);
          setBaseline(JSON.stringify(next));
          setRecordId(String(result.data.id));
          router.replace(`/admin/colecoes/${result.data.id}`);
        }
      } catch (err) {
        if (isVersionConflict(err)) {
          setConflict({ actorName: conflictActor(err), updatedAt: conflictAt(err) });
        } else {
          setError(err instanceof AdminApiError ? err.message : "Não foi possível salvar a coleção.");
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
    const response = await fetch(`/v1/admin/collections/${recordId}`, { credentials: "include" });
    const payload = (await response.json()) as { data: Record<string, unknown> };
    const next = hydrateCollection(payload.data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setConflict(null);
  }

  const previewPath = `/colecoes/${form.slug || "slug"}`;

  return (
    <div className="grid max-w-4xl gap-6">
      {conflict ? (
        <ConflictBanner actorName={conflict.actorName} updatedAt={conflict.updatedAt} onReload={() => void reloadCurrent()} />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <FormSection title="Informações básicas">
        <Field label="Nome">
          <input
            data-testid="collection-name"
            className={fieldClass}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              patch({ name, slug: slugTouched ? form.slug : slugify(name) });
            }}
          />
        </Field>
        <Field label="Slug">
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              patch({ slug: e.target.value });
            }}
          />
        </Field>
        <Field label="Resumo">
          <textarea className={fieldClass} rows={3} value={form.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} />
        </Field>
        <Field label="Descrição">
          <textarea className={fieldClass} rows={8} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
        </Field>
      </FormSection>

      <FormSection title="Mídia" description="Capa da coleção e galeria editorial.">
        <div>
          <p className="mb-2 text-sm">Capa</p>
          {form.cover ? (
            <MediaStrip items={[form.cover]} onRemove={() => patch({ cover: null })} onAdd={() => setCoverOpen(true)} addLabel="Trocar capa" />
          ) : (
            <button type="button" className="border border-border px-4 py-2 text-sm" onClick={() => setCoverOpen(true)}>
              Escolher capa
            </button>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm">Galeria</p>
          <MediaStrip
            items={form.gallery}
            onRemove={(id) => patch({ gallery: form.gallery.filter((item) => item.id !== id) })}
            onReorder={(from, to) => {
              const next = [...form.gallery];
              const item = next.splice(from, 1)[0];
              if (!item) return;
              next.splice(to, 0, item);
              patch({ gallery: next });
            }}
            onAdd={() => setGalleryOpen(true)}
          />
        </div>
        <MediaPicker open={coverOpen} multiple={false} selectedIds={form.cover ? [form.cover.id] : []} onClose={() => setCoverOpen(false)} onSelect={(items) => patch({ cover: items[0] ?? null })} />
        <MediaPicker open={galleryOpen} selectedIds={form.gallery.map((item) => item.id)} onClose={() => setGalleryOpen(false)} onSelect={(items) => patch({ gallery: items })} />
      </FormSection>

      <FormSection title="Comercial">
        <Field label="Preço a partir de" hint="Opcional. Ponto decimal, ex. 2490.00">
          <input className={fieldClass} value={form.priceFrom} onChange={(e) => patch({ priceFrom: e.target.value })} />
        </Field>
        <Field label="Ordem">
          <input type="number" min={0} className={fieldClass} value={form.sortOrder} onChange={(e) => patch({ sortOrder: Number(e.target.value) })} />
        </Field>
      </FormSection>

      <SeoPanel
        seoTitle={form.seoTitle}
        seoDescription={form.seoDescription}
        canonicalPath={form.canonicalPath}
        ogImage={form.ogImage}
        fallbackTitle={form.name}
        fallbackDescription={form.shortDescription}
        previewPath={previewPath}
        missingAlt={!form.cover?.alt}
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
            <option value="SCHEDULED">Agendada</option>
            <option value="PUBLISHED">Publicada</option>
            <option value="ARCHIVED">Arquivada</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => patch({ featured: e.target.checked })} />
          Destaque na homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isDemo} onChange={(e) => patch({ isDemo: e.target.checked })} />
          Conteúdo demonstrativo
        </label>
        {recordId ? (
          <Link href={`/admin/colecoes/${recordId}/historico`} className="text-sm underline">
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
            ? `/api/preview?type=collection&slug=${encodeURIComponent(String(form.slug))}&path=${encodeURIComponent(`/colecoes/${form.slug}`)}`
            : undefined
        }
      />
    </div>
  );
}
