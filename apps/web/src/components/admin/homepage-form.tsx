"use client";

import { useCallback, useMemo, useState } from "react";
import { defaultHomepageSections, type HomepageSection } from "@/lib/cms-defaults";
import { adminPut, AdminApiError, conflictActor, conflictAt, isVersionConflict } from "@/lib/admin-client";
import { ConflictBanner } from "./ui/conflict-banner";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { SaveBar } from "./ui/save-bar";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";

type HomepageState = {
  sections: HomepageSection[];
  version: number;
  updatedAt: string | null;
};

function sectionLabel(type: string) {
  const labels: Record<string, string> = {
    hero_campaign: "Hero da campanha",
    manifesto: "Manifesto",
    featured_collections: "Coleções em destaque",
    differentials: "Diferenciais",
    experience: "Experiência",
    ambassador: "Embaixador",
    commercial_cta: "Chamada comercial",
    HERO: "Hero",
    EDITORIAL_FEATURE: "Bloco editorial",
    AMBASSADOR: "Embaixador",
    BRAND_MANIFESTO: "Manifesto da marca",
    FEATURED_COLLECTIONS: "Coleções em destaque",
    FEATURE_HIGHLIGHTS: "Diferenciais",
    COMMERCIAL_CTA: "Chamada comercial",
  };
  return labels[type] ?? type;
}

export function HomepageForm({ initial }: { initial?: HomepageState | null }) {
  const [form, setForm] = useState<HomepageState>(
    initial ?? { sections: defaultHomepageSections, version: 1, updatedAt: null },
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial ?? { sections: defaultHomepageSections, version: 1 }));
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ actorName: string; updatedAt: string | null } | null>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);
  useUnsavedChanges(dirty);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    setConflict(null);
    try {
      const result = await adminPut<{ data: HomepageState }>("/v1/admin/homepage", {
        sections: form.sections,
        expectedVersion: form.version,
      });
      const next = {
        sections: result.data.sections,
        version: result.data.version,
        updatedAt: result.data.updatedAt ? String(result.data.updatedAt) : null,
      };
      setForm(next);
      setBaseline(JSON.stringify(next));
      setUnavailable(false);
    } catch (err) {
      if (isVersionConflict(err)) {
        setConflict({ actorName: conflictActor(err), updatedAt: conflictAt(err) });
      } else if (err instanceof AdminApiError && err.status === 503) {
        setUnavailable(true);
        setError("A homepage ainda depende da migration do CMS. O rascunho local não foi gravado.");
      } else {
        setError(err instanceof AdminApiError ? err.message : "Não foi possível salvar a homepage.");
      }
    } finally {
      setSaving(false);
    }
  }, [form]);

  useSaveHotkey(dirty, () => void save());

  async function reloadCurrent() {
    const response = await fetch("/v1/admin/homepage", { credentials: "include" });
    if (!response.ok) return;
    const payload = (await response.json()) as { data: HomepageState };
    const next = {
      sections: payload.data.sections,
      version: payload.data.version,
      updatedAt: payload.data.updatedAt ? String(payload.data.updatedAt) : null,
    };
    setForm(next);
    setBaseline(JSON.stringify(next));
    setConflict(null);
  }

  function updateSection(id: string, patch: Record<string, unknown>) {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === id ? ({ ...section, ...patch } as HomepageSection) : section)),
    }));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= form.sections.length) return;
    const next = [...form.sections];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setForm((current) => ({ ...current, sections: next }));
  }

  return (
    <div className="grid max-w-4xl gap-6">
      {unavailable ? (
        <p className="border border-border bg-surface px-4 py-3 text-sm text-foreground-muted">
          A API de homepage pode ainda estar aguardando schema. Você edita as seções aqui; o salvamento grava quando o endpoint responder.
        </p>
      ) : null}
      {conflict ? (
        <ConflictBanner actorName={conflict.actorName} updatedAt={conflict.updatedAt} onReload={() => void reloadCurrent()} />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {form.sections.map((section, index) => (
        <FormSection key={section.id} title={sectionLabel(section.type)} description={`Seção ${index + 1} · ${section.type}`}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSection(section.id, { enabled: e.target.checked })}
            />
            Visível na homepage
          </label>
          {"eyebrow" in section ? (
            <Field label="Eyebrow">
              <input className={fieldClass} value={String(section.eyebrow ?? "")} onChange={(e) => updateSection(section.id, { eyebrow: e.target.value })} />
            </Field>
          ) : null}
          {"quote" in section ? (
            <Field label="Citação">
              <textarea className={fieldClass} rows={3} value={String(section.quote ?? "")} onChange={(e) => updateSection(section.id, { quote: e.target.value })} />
            </Field>
          ) : null}
          {"title" in section ? (
            <Field label="Título">
              <input className={fieldClass} value={String(section.title ?? "")} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
            </Field>
          ) : null}
          {"headline" in section ? (
            <Field label="Headline">
              <input className={fieldClass} value={String(section.headline ?? "")} onChange={(e) => updateSection(section.id, { headline: e.target.value })} />
            </Field>
          ) : null}
          {"body" in section ? (
            <Field label="Texto">
              <textarea className={fieldClass} rows={4} value={String(section.body ?? "")} onChange={(e) => updateSection(section.id, { body: e.target.value })} />
            </Field>
          ) : null}
          {"ctaLabel" in section ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CTA">
                <input className={fieldClass} value={String(section.ctaLabel ?? "")} onChange={(e) => updateSection(section.id, { ctaLabel: e.target.value })} />
              </Field>
              <Field label="URL">
                <input className={fieldClass} value={String(section.ctaHref ?? "")} onChange={(e) => updateSection(section.id, { ctaHref: e.target.value })} />
              </Field>
            </div>
          ) : null}
          {"primaryLabel" in section ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CTA principal">
                <input className={fieldClass} value={String(section.primaryLabel ?? "")} onChange={(e) => updateSection(section.id, { primaryLabel: e.target.value })} />
              </Field>
              <Field label="URL principal">
                <input className={fieldClass} value={String(section.primaryHref ?? "")} onChange={(e) => updateSection(section.id, { primaryHref: e.target.value })} />
              </Field>
            </div>
          ) : null}
          <div className="flex gap-2 text-xs">
            <button type="button" className="underline" onClick={() => move(index, index - 1)}>
              Subir
            </button>
            <button type="button" className="underline" onClick={() => move(index, index + 1)}>
              Descer
            </button>
          </div>
        </FormSection>
      ))}

      <SaveBar
        dirty={dirty}
        saving={saving}
        lastSavedAt={form.updatedAt}
        hidePublish
        saveDraftLabel="Salvar homepage"
        onSaveDraft={() => void save()}
        onPublish={() => void save()}
        previewHref="/api/preview?type=home&path=/"
      />
    </div>
  );
}
