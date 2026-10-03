"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { withInstitutionalHero, type HomepageSection } from "@oston/contracts";
import { adminMutate, conflictActor, conflictAt, isVersionConflict } from "@/lib/admin-client";
import { PreviewButton } from "./preview-button";
import { ReorderControls, moveItem } from "./reorder-list";
import { ConflictBanner } from "./ui/conflict-banner";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";
import { MediaPicker } from "./media-picker";

type Media = { id: string; url: string; originalFilename?: string; alt: string | null };
type CampaignOption = { id: string; name: string; status: string };

const TYPE_LABEL: Record<string, string> = {
  BRAND_HERO: "Hero institucional da marca",
  SEASONAL_CAMPAIGN: "Campanha sazonal",
  HERO: "Campanha sazonal",
  hero_campaign: "Campanha sazonal",
  BRAND_MANIFESTO: "Manifesto",
  manifesto: "Manifesto",
  FEATURED_COLLECTIONS: "Coleções em destaque",
  featured_collections: "Coleções em destaque",
  FEATURE_HIGHLIGHTS: "Diferenciais",
  differentials: "Diferenciais",
  EDITORIAL_FEATURE: "Bloco editorial",
  experience: "Bloco editorial",
  AMBASSADOR: "Embaixador",
  ambassador: "Embaixador",
  COMMERCIAL_CTA: "Chamada comercial",
  commercial_cta: "Chamada comercial",
};

export function HomepageEditor({
  initial,
}: {
  initial: { sections: HomepageSection[]; version: number };
}) {
  const [sections, setSections] = useState(() => withInstitutionalHero(initial.sections));
  const [version, setVersion] = useState(initial.version);
  const [baseline, setBaseline] = useState(() => JSON.stringify(withInstitutionalHero(initial.sections)));
  const [media, setMedia] = useState<Media[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [conflict, setConflict] = useState<{ actorName: string; updatedAt: string | null } | null>(null);
  const dirty = useMemo(() => JSON.stringify(sections) !== baseline, [sections, baseline]);
  useUnsavedChanges(dirty);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      try {
        const responses = await Promise.all([
          fetch("/v1/admin/media?pageSize=50", { credentials: "include", signal: controller.signal }),
          fetch("/v1/admin/campaigns?pageSize=50", { credentials: "include", signal: controller.signal }),
        ]);
        if (responses.some((response) => !response.ok)) throw new Error("Não foi possível carregar as opções de mídia e campanha.");
        const [mediaPayload, campaignPayload] = await Promise.all(responses.map((response) => response.json()));
        if (!controller.signal.aborted) {
          setMedia(mediaPayload.data ?? []);
          setCampaigns(campaignPayload.data ?? []);
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Não foi possível carregar as opções.");
      }
    }
    void loadOptions();
    return () => controller.abort();
  }, []);

  function update(index: number, next: HomepageSection) {
    setSections((current) => current.map((section, i) => (i === index ? next : section)));
  }

  const save = useCallback(async () => {
    if (!dirty) return;
    setSaving(true);
    setError("");
    setMessage("");
    setConflict(null);
    try {
      const payload = await adminMutate<{ data: { sections: HomepageSection[]; version: number } }>(
        "/v1/admin/homepage",
        "PUT",
        { sections, expectedVersion: version },
      );
      setSections(payload.data.sections);
      setVersion(payload.data.version);
      setBaseline(JSON.stringify(payload.data.sections));
      setMessage("Homepage publicada. A atualização do site pode levar até um minuto.");
    } catch (err) {
      if (isVersionConflict(err)) {
        setConflict({ actorName: conflictActor(err), updatedAt: conflictAt(err) });
      } else {
        setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      }
    } finally {
      setSaving(false);
    }
  }, [dirty, sections, version]);

  useSaveHotkey(dirty, () => {
    void save();
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await save();
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-4xl gap-6">
      <p className="text-sm text-foreground-muted">
        A identidade da marca e as campanhas são independentes. Salvar publica as alterações; o preview mostra a última versão salva.
      </p>
      <ol className="grid gap-4">
        {sections.map((section, index) => (
          <li
            key={section.id}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging === null || dragging === index) return;
              setSections((current) => {
                const copy = [...current];
                const [removed] = copy.splice(dragging, 1);
                copy.splice(index, 0, removed as HomepageSection);
                return copy;
              });
              setDragging(null);
            }}
            className="border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(event) => update(index, { ...section, enabled: event.target.checked })}
                />
                {TYPE_LABEL[section.type] ?? section.type}
              </label>
              <ReorderControls
                index={index}
                total={sections.length}
                label={TYPE_LABEL[section.type] ?? section.type}
                onMove={(direction) => setSections((current) => moveItem(current, index, direction))}
              />
            </div>
            <SectionFields
              section={section}
              media={media}
              campaigns={campaigns}
              onChange={(next) => update(index, next)}
            />
          </li>
        ))}
      </ol>
      {conflict ? (
        <ConflictBanner
          actorName={conflict.actorName}
          updatedAt={conflict.updatedAt}
          onReload={() => window.location.reload()}
        />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || !dirty} className="bg-foreground px-5 py-2 text-foreground-inverse">
          {saving ? "Publicando…" : "Salvar e publicar homepage"}
        </button>
        <PreviewButton type="home" path="/" />
      </div>
    </form>
  );
}

function SectionFields({
  section,
  media,
  campaigns,
  onChange,
}: {
  section: HomepageSection;
  media: Media[];
  campaigns: CampaignOption[];
  onChange: (section: HomepageSection) => void;
}) {
  const [heroImage, setHeroImage] = useState<"desktopImageId" | "mobileImageId" | null>(null);

  if (section.type === "BRAND_HERO") {
    return (
      <div className="mt-4 grid gap-4">
        <p className="text-sm text-foreground-muted">Conteúdo permanente da marca. Campanhas sazonais não alteram esta apresentação.</p>
        <Field label="Texto de abertura" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        <Field label="Título principal" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
        <Area label="Apresentação" value={section.subtitle} onChange={(value) => onChange({ ...section, subtitle: value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          {(["desktopImageId", "mobileImageId"] as const).map((key) => (
            <div key={key} className="grid gap-2 border border-border p-3 text-sm">
              <p>{key === "desktopImageId" ? "Imagem desktop" : "Imagem mobile"}</p>
              <p className="truncate text-foreground-muted">{section[key] ? media.find((item) => item.id === section[key])?.originalFilename ?? "Imagem selecionada" : "Imagem editorial padrão"}</p>
              <div className="flex gap-3">
                <button type="button" className="underline" onClick={() => setHeroImage(key)}>Escolher imagem</button>
                {section[key] ? <button type="button" className="underline" onClick={() => onChange({ ...section, [key]: null })}>Usar padrão</button> : null}
              </div>
            </div>
          ))}
        </div>
        <MediaPicker
          open={heroImage !== null}
          multiple={false}
          selectedIds={heroImage && section[heroImage] ? [section[heroImage]] : []}
          onClose={() => setHeroImage(null)}
          onSelect={(items) => { if (heroImage && items[0]) onChange({ ...section, [heroImage]: items[0].id }); }}
        />
        <Field label="Descrição acessível da imagem" value={section.imageAlt} onChange={(value) => onChange({ ...section, imageAlt: value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Chamada principal" value={section.primaryCtaLabel} onChange={(value) => onChange({ ...section, primaryCtaLabel: value })} />
          <Field label="Destino principal" value={section.primaryCtaUrl} onChange={(value) => onChange({ ...section, primaryCtaUrl: value })} />
          <Field label="Chamada secundária" value={section.secondaryCtaLabel ?? ""} onChange={(value) => onChange({ ...section, secondaryCtaLabel: value || undefined })} />
          <Field label="Destino secundário" value={section.secondaryCtaUrl ?? ""} onChange={(value) => onChange({ ...section, secondaryCtaUrl: value || undefined })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">Alinhamento
            <select className="border border-border px-3 py-2" value={section.textAlign} onChange={(event) => onChange({ ...section, textAlign: event.target.value as "left" | "center" | "right" })}>
              <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Ponto focal
            <select className="border border-border px-3 py-2" value={section.focalPosition} onChange={(event) => onChange({ ...section, focalPosition: event.target.value as typeof section.focalPosition })}>
              {["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Escurecimento (0–80)
            <input type="number" min={0} max={80} className="border border-border px-3 py-2" value={section.overlay} onChange={(event) => onChange({ ...section, overlay: Number(event.target.value) })} />
          </label>
        </div>
      </div>
    );
  }

  if (section.type === "HERO" || section.type === "SEASONAL_CAMPAIGN") {
    return (
      <div className="mt-4 grid gap-3 text-sm">
      <label className="grid gap-1">
        Campanha exibida abaixo da marca
        <select
          className="border border-border px-3 py-2"
          value={section.campaignId ?? ""}
          onChange={(event) => onChange({ ...section, campaignId: event.target.value || null })}
        >
          <option value="">Automática: menor ordem entre campanhas vigentes</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name} ({campaign.status})
            </option>
          ))}
        </select>
      </label>
      <p className="text-foreground-muted">A seleção manual respeita publicação e datas. Se estiver em rascunho, expirada ou na lixeira, o espaço fica oculto. Em modo automático, vence a menor ordem; empates usam a atualização mais recente.</p>
      </div>
    );
  }

  if (section.type === "hero_campaign") {
    return <p className="mt-4 text-sm text-foreground-muted">Exibe a campanha vigente de menor ordem abaixo da marca. Sem campanha vigente, o espaço fica oculto. Edite datas, imagens e chamadas em Campanhas.</p>;
  }

  if (section.type === "BRAND_MANIFESTO") {
    return (
      <div className="mt-4 grid gap-3">
        <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        <Field label="Headline" value={section.headline} onChange={(value) => onChange({ ...section, headline: value })} />
        <Area label="Texto" value={section.body} onChange={(value) => onChange({ ...section, body: value })} />
      </div>
    );
  }

  if (section.type === "manifesto") {
    return (
      <div className="mt-4 grid gap-3">
        <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        <Field label="Headline" value={section.quote} onChange={(value) => onChange({ ...section, quote: value })} />
        <Area label="Texto" value={section.body} onChange={(value) => onChange({ ...section, body: value })} />
      </div>
    );
  }

  if (section.type === "FEATURED_COLLECTIONS") {
    return (
      <div className="mt-4 grid gap-3">
        <Field label="Título" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
        <Field label="Subtítulo" value={section.subtitle} onChange={(value) => onChange({ ...section, subtitle: value })} />
      </div>
    );
  }

  if (section.type === "featured_collections") {
    return (
      <div className="mt-4 grid gap-3">
        <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        <Field label="Título" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
        <Field label="CTA" value={section.ctaLabel} onChange={(value) => onChange({ ...section, ctaLabel: value })} />
        <Field label="URL do CTA" value={section.ctaHref} onChange={(value) => onChange({ ...section, ctaHref: value })} />
      </div>
    );
  }

  if (section.type === "FEATURE_HIGHLIGHTS" || section.type === "differentials") {
    return (
      <div className="mt-4 grid gap-3">
        {"eyebrow" in section ? (
          <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        ) : null}
        <Field label="Título" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
        {section.items.map((item, itemIndex) => (
          <div key={`${item.title}-${itemIndex}`} className="grid gap-2 border border-border p-3 md:grid-cols-2">
            <Field
              label={`Diferencial ${itemIndex + 1}`}
              value={item.title}
              onChange={(value) =>
                onChange({
                  ...section,
                  items: section.items.map((current, i) => (i === itemIndex ? { ...current, title: value } : current)),
                })
              }
            />
            <Area
              label="Texto"
              value={item.text}
              onChange={(value) =>
                onChange({
                  ...section,
                  items: section.items.map((current, i) => (i === itemIndex ? { ...current, text: value } : current)),
                })
              }
            />
          </div>
        ))}
      </div>
    );
  }

  if (
    section.type === "EDITORIAL_FEATURE" ||
    section.type === "AMBASSADOR" ||
    section.type === "experience" ||
    section.type === "ambassador"
  ) {
    const headline = "headline" in section && section.headline ? section.headline : "title" in section ? section.title ?? "" : "";
    return (
      <div className="mt-4 grid gap-3">
        <Field
          label="Eyebrow"
          value={section.eyebrow ?? ""}
          onChange={(value) => onChange({ ...section, eyebrow: value })}
        />
        <Field
          label="Headline"
          value={headline}
          onChange={(value) =>
            onChange(
              section.type === "AMBASSADOR"
                ? { ...section, headline: value, title: value }
                : { ...section, title: value },
            )
          }
        />
        <Area label="Texto" value={section.body ?? ""} onChange={(value) => onChange({ ...section, body: value })} />
        {"imageId" in section ? (
          <label className="grid gap-1 text-sm">
            Imagem
            <select
              className="border border-border px-3 py-2"
              value={section.imageId ?? ""}
              onChange={(event) => onChange({ ...section, imageId: event.target.value || null })}
            >
              <option value="">Imagem demonstrativa</option>
              {media.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.originalFilename ?? item.id}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    );
  }

  if (section.type === "COMMERCIAL_CTA") {
    return (
      <div className="mt-4 grid gap-3">
        <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        <Field label="Headline" value={section.headline} onChange={(value) => onChange({ ...section, headline: value })} />
        <Area label="Texto" value={section.body} onChange={(value) => onChange({ ...section, body: value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA principal" value={section.primaryLabel} onChange={(value) => onChange({ ...section, primaryLabel: value })} />
          <Field label="URL principal" value={section.primaryHref} onChange={(value) => onChange({ ...section, primaryHref: value })} />
          <Field label="CTA secundário" value={section.secondaryLabel} onChange={(value) => onChange({ ...section, secondaryLabel: value })} />
          <Field label="URL secundária" value={section.secondaryHref} onChange={(value) => onChange({ ...section, secondaryHref: value })} />
        </div>
      </div>
    );
  }

  if (section.type === "commercial_cta") {
    return (
      <div className="mt-4 grid gap-3">
        <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
        <Field label="Headline" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
        <Area label="Texto" value={section.body} onChange={(value) => onChange({ ...section, body: value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA principal" value={section.primaryLabel} onChange={(value) => onChange({ ...section, primaryLabel: value })} />
          <Field label="URL principal" value={section.primaryHref} onChange={(value) => onChange({ ...section, primaryHref: value })} />
          <Field label="CTA secundário" value={section.secondaryLabel ?? ""} onChange={(value) => onChange({ ...section, secondaryLabel: value })} />
          <Field label="URL secundária" value={section.secondaryHref ?? ""} onChange={(value) => onChange({ ...section, secondaryHref: value })} />
        </div>
      </div>
    );
  }

  return null;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input className="border border-border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <textarea className="border border-border px-3 py-2" rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
