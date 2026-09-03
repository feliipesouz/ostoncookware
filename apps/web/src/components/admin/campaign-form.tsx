"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMutate, adminPut, AdminApiError, conflictActor, conflictAt, isVersionConflict } from "@/lib/admin-client";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/admin-format";
import { MediaPicker, MediaStrip, type PickedMedia } from "./media-picker";
import { ConflictBanner } from "./ui/conflict-banner";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { SaveBar } from "./ui/save-bar";
import { StatusBadge } from "./ui/status-badge";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";

type CampaignState = {
  name: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  desktop: PickedMedia | null;
  mobile: PickedMedia | null;
  video: PickedMedia | null;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  textAlign: string;
  focalPosition: string;
  overlay: number;
  startsAt: string;
  endsAt: string;
  status: string;
  sortOrder: number;
  collectionId: string;
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

export function hydrateCampaign(data: Record<string, unknown>): CampaignState {
  return {
    name: String(data.name ?? ""),
    eyebrow: String(data.eyebrow ?? "OSTON Cookware"),
    title: String(data.title ?? ""),
    subtitle: String(data.subtitle ?? ""),
    desktop: asMedia(data.desktopImage),
    mobile: asMedia(data.mobileImage),
    video: asMedia(data.video),
    imageAlt: String(data.imageAlt ?? ""),
    primaryCtaLabel: String(data.primaryCtaLabel ?? "Conhecer coleções"),
    primaryCtaUrl: String(data.primaryCtaUrl ?? "/colecoes"),
    secondaryCtaLabel: String(data.secondaryCtaLabel ?? ""),
    secondaryCtaUrl: String(data.secondaryCtaUrl ?? ""),
    textAlign: String(data.textAlign ?? "left"),
    focalPosition: String(data.focalPosition ?? "center"),
    overlay: Number(data.overlay ?? 42),
    startsAt: toDatetimeLocal(data.startsAt as string | null),
    endsAt: toDatetimeLocal(data.endsAt as string | null),
    status: String(data.status ?? "DRAFT"),
    sortOrder: Number(data.sortOrder ?? 0),
    collectionId: String(data.collectionId ?? ""),
    version: typeof data.version === "number" && data.version > 0 ? data.version : 1,
    updatedAt: data.updatedAt ? String(data.updatedAt) : null,
    updatedByName: typeof data.updatedByName === "string" ? data.updatedByName : null,
  };
}

const emptyCampaign: CampaignState = hydrateCampaign({});

export function CampaignForm({ id, initial }: { id?: string; initial?: Record<string, unknown> }) {
  const router = useRouter();
  const [form, setForm] = useState<CampaignState>(initial ? hydrateCampaign(initial) : emptyCampaign);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial ? hydrateCampaign(initial) : emptyCampaign));
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ actorName: string; updatedAt: string | null } | null>(null);
  const [picker, setPicker] = useState<"desktop" | "mobile" | "video" | null>(null);
  const [recordId, setRecordId] = useState(id);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);
  useUnsavedChanges(dirty);

  useEffect(() => {
    void fetch("/v1/admin/collections?pageSize=50", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setCollections(payload.data ?? []));
  }, []);

  function patch(partial: Partial<CampaignState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  const save = useCallback(
    async (status: string) => {
      setSaving(true);
      setError("");
      setConflict(null);
      try {
        if (!form.desktop?.id || !form.mobile?.id) {
          setError("Campanha precisa de imagem desktop e mobile.");
          setSaving(false);
          return;
        }
        if (!form.imageAlt.trim()) {
          setError("Informe o texto ALT das imagens do hero.");
          setSaving(false);
          return;
        }
        if (status === "SCHEDULED" && !form.startsAt) {
          setError("Campanha agendada precisa de data de início.");
          setSaving(false);
          return;
        }
        const payload = {
          name: form.name.trim(),
          eyebrow: form.eyebrow.trim() || null,
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          desktopImageId: form.desktop.id,
          mobileImageId: form.mobile.id,
          videoId: form.video?.id ?? null,
          imageAlt: form.imageAlt.trim(),
          primaryCtaLabel: form.primaryCtaLabel.trim(),
          primaryCtaUrl: form.primaryCtaUrl.trim(),
          secondaryCtaLabel: form.secondaryCtaLabel.trim() || null,
          secondaryCtaUrl: form.secondaryCtaUrl.trim() || null,
          textAlign: form.textAlign,
          focalPosition: form.focalPosition,
          overlay: Number(form.overlay),
          startsAt: fromDatetimeLocal(form.startsAt),
          endsAt: fromDatetimeLocal(form.endsAt),
          status,
          sortOrder: Number(form.sortOrder) || 0,
          collectionId: form.collectionId || null,
          expectedVersion: form.version,
        };
        if (recordId) {
          const result = await adminPut<{ data: Record<string, unknown> }>(`/v1/admin/campaigns/${recordId}`, payload);
          const next = hydrateCampaign(result.data);
          setForm(next);
          setBaseline(JSON.stringify(next));
        } else {
          const result = await adminMutate<{ data: Record<string, unknown> }>("/v1/admin/campaigns", "POST", payload);
          const next = hydrateCampaign(result.data);
          setForm(next);
          setBaseline(JSON.stringify(next));
          setRecordId(String(result.data.id));
          router.replace(`/admin/campanhas/${result.data.id}`);
        }
      } catch (err) {
        if (isVersionConflict(err)) {
          setConflict({ actorName: conflictActor(err), updatedAt: conflictAt(err) });
        } else {
          setError(err instanceof AdminApiError ? err.message : "Não foi possível salvar a campanha.");
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
    const response = await fetch(`/v1/admin/campaigns/${recordId}`, { credentials: "include" });
    const payload = (await response.json()) as { data: Record<string, unknown> };
    const next = hydrateCampaign(payload.data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setConflict(null);
  }

  return (
    <div className="grid max-w-4xl gap-6">
      {conflict ? (
        <ConflictBanner actorName={conflict.actorName} updatedAt={conflict.updatedAt} onReload={() => void reloadCurrent()} />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <FormSection title="Informações básicas" description="O nome interno não aparece no site. Headline e subtítulo são o hero.">
        <Field label="Nome interno">
          <input className={fieldClass} value={form.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="Eyebrow">
          <input className={fieldClass} value={form.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
        </Field>
        <Field label="Headline">
          <input className={fieldClass} value={form.title} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field label="Subtítulo">
          <textarea className={fieldClass} rows={3} value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
        </Field>
      </FormSection>

      <FormSection
        title="Mídia"
        description="Desktop: recorte cinematográfico 16:9 ou 21:9, pelo menos 1920px de largura. Mobile: 4:5 ou 9:16, pensado para a dobra do telefone. ALT descreve a cena, não o arquivo."
      >
        <div>
          <p className="mb-2 text-sm">Imagem desktop (16:9)</p>
          {form.desktop ? (
            <MediaStrip items={[form.desktop]} onRemove={() => patch({ desktop: null })} onAdd={() => setPicker("desktop")} addLabel="Trocar desktop" />
          ) : (
            <button type="button" className="border border-border px-4 py-2 text-sm" onClick={() => setPicker("desktop")}>
              Escolher desktop
            </button>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm">Imagem mobile (4:5)</p>
          {form.mobile ? (
            <MediaStrip items={[form.mobile]} onRemove={() => patch({ mobile: null })} onAdd={() => setPicker("mobile")} addLabel="Trocar mobile" />
          ) : (
            <button type="button" className="border border-border px-4 py-2 text-sm" onClick={() => setPicker("mobile")}>
              Escolher mobile
            </button>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm">Vídeo (opcional)</p>
          {form.video ? (
            <MediaStrip items={[form.video]} onRemove={() => patch({ video: null })} onAdd={() => setPicker("video")} addLabel="Trocar vídeo" />
          ) : (
            <button type="button" className="border border-border px-4 py-2 text-sm" onClick={() => setPicker("video")}>
              Escolher vídeo
            </button>
          )}
        </div>
        <Field label="ALT da imagem">
          <input className={fieldClass} value={form.imageAlt} onChange={(e) => patch({ imageAlt: e.target.value })} />
        </Field>
        <MediaPicker
          open={picker !== null}
          multiple={false}
          selectedIds={picker === "desktop" ? (form.desktop ? [form.desktop.id] : []) : picker === "mobile" ? (form.mobile ? [form.mobile.id] : []) : form.video ? [form.video.id] : []}
          onClose={() => setPicker(null)}
          onSelect={(items) => {
            const item = items[0] ?? null;
            if (picker === "desktop") patch({ desktop: item });
            if (picker === "mobile") patch({ mobile: item });
            if (picker === "video") patch({ video: item });
          }}
        />
      </FormSection>

      <FormSection title="Chamadas">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA principal">
            <input className={fieldClass} value={form.primaryCtaLabel} onChange={(e) => patch({ primaryCtaLabel: e.target.value })} />
          </Field>
          <Field label="URL do CTA">
            <input className={fieldClass} value={form.primaryCtaUrl} onChange={(e) => patch({ primaryCtaUrl: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA secundário">
            <input className={fieldClass} value={form.secondaryCtaLabel} onChange={(e) => patch({ secondaryCtaLabel: e.target.value })} />
          </Field>
          <Field label="URL secundária">
            <input className={fieldClass} value={form.secondaryCtaUrl} onChange={(e) => patch({ secondaryCtaUrl: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Alinhamento do texto">
            <select className={fieldClass} value={form.textAlign} onChange={(e) => patch({ textAlign: e.target.value })}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
          <Field label="Ponto focal">
            <select className={fieldClass} value={form.focalPosition} onChange={(e) => patch({ focalPosition: e.target.value })}>
              {["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Overlay (0–80)">
            <input type="number" min={0} max={80} className={fieldClass} value={form.overlay} onChange={(e) => patch({ overlay: Number(e.target.value) })} />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Agenda e publicação"
        description="SCHEDULED só entra no ar entre início e fim. Sem data de início, a campanha não agenda de verdade."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={form.status} />
          <span className="text-sm text-foreground-muted">versão {form.version}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select className={fieldClass} value={form.status} onChange={(e) => patch({ status: e.target.value })}>
              <option value="DRAFT">Rascunho</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="PUBLISHED">Publicada</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
          </Field>
          <Field label="Ordem">
            <input type="number" min={0} className={fieldClass} value={form.sortOrder} onChange={(e) => patch({ sortOrder: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Início" hint="Obrigatório para agendar.">
            <input type="datetime-local" className={fieldClass} value={form.startsAt} onChange={(e) => patch({ startsAt: e.target.value })} />
          </Field>
          <Field label="Fim" hint="Opcional. Vazio = permanece até alguém arquivar.">
            <input type="datetime-local" className={fieldClass} value={form.endsAt} onChange={(e) => patch({ endsAt: e.target.value })} />
          </Field>
        </div>
        <Field label="Coleção promovida">
          <select className={fieldClass} value={form.collectionId} onChange={(e) => patch({ collectionId: e.target.value })}>
            <option value="">Nenhuma</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        {recordId ? (
          <Link href={`/admin/campanhas/${recordId}/historico`} className="text-sm underline">
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
        onSchedule={() => void save("SCHEDULED")}
        previewHref={
          recordId
            ? `/api/preview?type=campaign&id=${encodeURIComponent(recordId)}&path=/`
            : "/api/preview?type=home&path=/"
        }
      />
    </div>
  );
}
