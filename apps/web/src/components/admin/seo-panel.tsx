"use client";

import { Field, fieldClass, FormSection } from "./ui/form-section";
import { MediaPicker, MediaStrip, type PickedMedia } from "./media-picker";
import { useState } from "react";

export function SeoPanel({
  seoTitle,
  seoDescription,
  canonicalPath,
  ogImage,
  fallbackTitle,
  fallbackDescription,
  previewPath,
  missingAlt,
  onChange,
  onOgChange,
}: {
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  ogImage: PickedMedia | null;
  fallbackTitle: string;
  fallbackDescription: string;
  previewPath: string;
  missingAlt: boolean;
  onChange: (patch: { seoTitle?: string; seoDescription?: string; canonicalPath?: string }) => void;
  onOgChange: (image: PickedMedia | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const title = seoTitle || fallbackTitle || "Título da página";
  const description = seoDescription || fallbackDescription || "";
  const site = "ostoncookware.com";
  const warnings = [
    !description.trim() ? "Falta uma meta description. O Google vai improvisar um trecho da página." : null,
    !ogImage ? "Sem imagem Open Graph. No WhatsApp e no Instagram o card fica sem retrato." : null,
    missingAlt ? "Há imagem sem texto ALT. Isso prejudica acessibilidade e busca de imagens." : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <FormSection
      title="SEO"
      description="Como este conteúdo aparece no Google e quando alguém compartilha o link. Não usamos nota numérica: os avisos abaixo são o que importa."
    >
      <Field label="Título SEO" hint={`${(seoTitle || fallbackTitle).length}/70 · se vazio, usamos o nome.`}>
        <input className={fieldClass} maxLength={70} value={seoTitle} onChange={(e) => onChange({ seoTitle: e.target.value })} />
      </Field>
      <Field label="Meta description" hint={`${(seoDescription || fallbackDescription).length}/320`}>
        <textarea
          rows={3}
          className={fieldClass}
          maxLength={320}
          value={seoDescription}
          onChange={(e) => onChange({ seoDescription: e.target.value })}
        />
      </Field>
      <Field label="URL canônica" hint="Caminho começando com /, por exemplo /produtos/linha-imperial">
        <input
          className={fieldClass}
          value={canonicalPath}
          placeholder={previewPath}
          onChange={(e) => onChange({ canonicalPath: e.target.value })}
        />
      </Field>
      <div>
        <p className="mb-2 text-sm">Imagem Open Graph</p>
        {ogImage ? (
          <MediaStrip items={[ogImage]} onRemove={() => onOgChange(null)} onAdd={() => setPickerOpen(true)} addLabel="Trocar imagem" />
        ) : (
          <button type="button" className="border border-border px-4 py-2 text-sm" onClick={() => setPickerOpen(true)}>
            Escolher imagem OG
          </button>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-background p-4">
          <p className="text-[0.65rem] uppercase text-foreground-muted">Prévia Google</p>
          <p className="mt-3 text-xs text-success">{site} {previewPath}</p>
          <p className="mt-1 text-base text-[#1a0dab]">{title}</p>
          <p className="mt-1 text-sm text-foreground-muted">{description || "A description aparece aqui."}</p>
        </div>
        <div className="overflow-hidden border border-border bg-background">
          <p className="px-4 pt-4 text-[0.65rem] uppercase text-foreground-muted">Card de compartilhamento</p>
          {ogImage ? (
            <div className="mt-3 aspect-[1.91/1] bg-graphite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ogImage.url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="mt-3 flex aspect-[1.91/1] items-center justify-center bg-graphite text-xs text-foreground-inverse/70">
              Sem imagem
            </div>
          )}
          <div className="p-4">
            <p className="text-[0.65rem] uppercase text-foreground-muted">{site}</p>
            <p className="mt-1 text-sm">{title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{description || "Sem description."}</p>
          </div>
        </div>
      </div>
      {warnings.length > 0 ? (
        <ul className="grid gap-1 text-sm text-warning">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-success">Título, description e imagem de compartilhamento estão preenchidos.</p>
      )}
      <MediaPicker
        open={pickerOpen}
        multiple={false}
        selectedIds={ogImage ? [ogImage.id] : []}
        onClose={() => setPickerOpen(false)}
        onSelect={(items) => onOgChange(items[0] ?? null)}
      />
    </FormSection>
  );
}
