"use client";

import { useCallback, useMemo, useState } from "react";
import { adminPut, AdminApiError, adminErrorMessage } from "@/lib/admin-client";
import { MediaPicker, MediaStrip, type PickedMedia } from "./media-picker";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { SaveBar } from "./ui/save-bar";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";

type SettingsState = Record<string, string>;

function asMedia(value: unknown): PickedMedia | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string") return null;
  return {
    id: item.id,
    url: typeof item.url === "string" ? item.url : "",
    alt: typeof item.alt === "string" ? item.alt : null,
  };
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

export function SettingsForm({ initial }: { initial: Record<string, unknown> }) {
  const [form, setForm] = useState<SettingsState>({
    brandName: text(initial.brandName),
    tagline: text(initial.tagline),
    whatsapp: text(initial.whatsapp),
    phone: text(initial.phone),
    email: text(initial.email),
    addressLine: text(initial.addressLine),
    addressCity: text(initial.addressCity),
    addressState: text(initial.addressState),
    instagram: text(initial.instagram),
    facebook: text(initial.facebook),
    youtube: text(initial.youtube),
    defaultSeoTitle: text(initial.defaultSeoTitle),
    defaultSeoDescription: text(initial.defaultSeoDescription),
    footerText: text(initial.footerText),
    copyrightText: text(initial.copyrightText),
    vercelAnalyticsId: text(initial.vercelAnalyticsId),
    gtmId: text(initial.gtmId),
    gaId: text(initial.gaId),
    whatsappMessage: text(initial.whatsappMessage),
    businessHours: text(initial.businessHours),
    privacyPolicyUrl: text(initial.privacyPolicyUrl),
    termsUrl: text(initial.termsUrl),
  });
  const [logo, setLogo] = useState<PickedMedia | null>(asMedia(initial.logo));
  const [logoInverse, setLogoInverse] = useState<PickedMedia | null>(asMedia(initial.logoInverse));
  const [favicon, setFavicon] = useState<PickedMedia | null>(asMedia(initial.favicon));
  const [og, setOg] = useState<PickedMedia | null>(asMedia(initial.defaultOgImage));
  const [catalog, setCatalog] = useState<PickedMedia | null>(asMedia(initial.catalogPdf));
  const [picker, setPicker] = useState<"logo" | "logoInverse" | "favicon" | "og" | "catalog" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt ? String(initial.updatedAt) : null);
  const snapshot = useMemo(
    () => JSON.stringify({ form, logo: logo?.id, logoInverse: logoInverse?.id, favicon: favicon?.id, og: og?.id, catalog: catalog?.id }),
    [form, logo, logoInverse, favicon, og, catalog],
  );
  const [baseline, setBaseline] = useState(snapshot);
  const dirty = snapshot !== baseline;
  useUnsavedChanges(dirty);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await adminPut<{ data: Record<string, unknown> }>("/v1/admin/settings", {
        ...form,
        brandName: form.brandName,
        defaultSeoTitle: form.defaultSeoTitle,
        defaultSeoDescription: form.defaultSeoDescription,
        logoId: logo?.id ?? null,
        logoInverseId: logoInverse?.id ?? null,
        faviconId: favicon?.id ?? null,
        defaultOgImageId: og?.id ?? null,
        catalogPdfId: catalog?.id ?? null,
      });
      setSavedAt(result.data.updatedAt ? String(result.data.updatedAt) : new Date().toISOString());
      setMessage("Configurações salvas.");
      setBaseline(snapshot);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [form, logo, logoInverse, favicon, og, catalog, snapshot]);

  useSaveHotkey(dirty, () => void save());

  function set(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyPick(items: PickedMedia[]) {
    const item = items[0] ?? null;
    if (picker === "logo") setLogo(item);
    if (picker === "logoInverse") setLogoInverse(item);
    if (picker === "favicon") setFavicon(item);
    if (picker === "og") setOg(item);
    if (picker === "catalog") setCatalog(item);
  }

  return (
    <div className="mt-8 grid max-w-3xl gap-6">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <FormSection title="Marca" description="Nome, assinatura e marcas visuais do CMS e do site.">
        <Field label="Nome da marca">
          <input className={fieldClass} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />
        </Field>
        <Field label="Tagline">
          <input className={fieldClass} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <AssetField label="Logo" item={logo} onPick={() => setPicker("logo")} onClear={() => setLogo(null)} />
        <AssetField label="Logo inversa" item={logoInverse} onPick={() => setPicker("logoInverse")} onClear={() => setLogoInverse(null)} />
        <AssetField label="Favicon" item={favicon} onPick={() => setPicker("favicon")} onClear={() => setFavicon(null)} />
      </FormSection>

      <FormSection title="Contatos">
        <Field label="WhatsApp">
          <input className={fieldClass} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </Field>
        <Field label="Telefone">
          <input className={fieldClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input className={fieldClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Endereço">
          <input className={fieldClass} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cidade">
            <input className={fieldClass} value={form.addressCity} onChange={(e) => set("addressCity", e.target.value)} />
          </Field>
          <Field label="Estado">
            <input className={fieldClass} value={form.addressState} onChange={(e) => set("addressState", e.target.value)} />
          </Field>
        </div>
        <Field label="Horário de atendimento">
          <input className={fieldClass} value={form.businessHours} onChange={(e) => set("businessHours", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Redes">
        <Field label="Instagram">
          <input className={fieldClass} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </Field>
        <Field label="Facebook">
          <input className={fieldClass} value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
        </Field>
        <Field label="YouTube">
          <input className={fieldClass} value={form.youtube} onChange={(e) => set("youtube", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="SEO padrão" description="Usado quando a página não define título, description ou imagem próprios.">
        <Field label="Título SEO padrão">
          <input className={fieldClass} maxLength={70} value={form.defaultSeoTitle} onChange={(e) => set("defaultSeoTitle", e.target.value)} />
        </Field>
        <Field label="Description padrão">
          <textarea className={fieldClass} rows={3} maxLength={320} value={form.defaultSeoDescription} onChange={(e) => set("defaultSeoDescription", e.target.value)} />
        </Field>
        <AssetField label="Imagem Open Graph padrão" item={og} onPick={() => setPicker("og")} onClear={() => setOg(null)} />
        <Field label="Texto do rodapé">
          <textarea className={fieldClass} rows={3} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />
        </Field>
        <Field label="Copyright">
          <input className={fieldClass} value={form.copyrightText} onChange={(e) => set("copyrightText", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Analytics">
        <Field label="Vercel Analytics ID">
          <input className={fieldClass} value={form.vercelAnalyticsId} onChange={(e) => set("vercelAnalyticsId", e.target.value)} />
        </Field>
        <Field label="GTM ID">
          <input className={fieldClass} value={form.gtmId} onChange={(e) => set("gtmId", e.target.value)} />
        </Field>
        <Field label="GA ID">
          <input className={fieldClass} value={form.gaId} onChange={(e) => set("gaId", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Comercial" description="Mensagem pronta do WhatsApp e PDF do catálogo para o consultor enviar.">
        <Field label="Mensagem padrão do WhatsApp">
          <textarea className={fieldClass} rows={3} value={form.whatsappMessage} onChange={(e) => set("whatsappMessage", e.target.value)} />
        </Field>
        <AssetField label="Catálogo em PDF" item={catalog} onPick={() => setPicker("catalog")} onClear={() => setCatalog(null)} />
      </FormSection>

      <FormSection title="Legal">
        <Field label="URL da política de privacidade">
          <input className={fieldClass} value={form.privacyPolicyUrl} onChange={(e) => set("privacyPolicyUrl", e.target.value)} />
        </Field>
        <Field label="URL dos termos">
          <input className={fieldClass} value={form.termsUrl} onChange={(e) => set("termsUrl", e.target.value)} />
        </Field>
      </FormSection>

      <MediaPicker
        open={picker !== null}
        multiple={false}
        selectedIds={[]}
        onClose={() => setPicker(null)}
        onSelect={applyPick}
      />

      <SaveBar
        dirty={dirty}
        saving={saving}
        lastSavedAt={savedAt}
        hidePublish
        saveDraftLabel="Salvar"
        onSaveDraft={() => void save()}
        onPublish={() => void save()}
      />
    </div>
  );
}

function AssetField({
  label,
  item,
  onPick,
  onClear,
}: {
  label: string;
  item: PickedMedia | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm">{label}</p>
      {item ? (
        <MediaStrip items={[item]} onRemove={onClear} onAdd={onPick} addLabel="Trocar" />
      ) : (
        <button type="button" className="border border-border px-4 py-2 text-sm" onClick={onPick}>
          Escolher
        </button>
      )}
    </div>
  );
}
