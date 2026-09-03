"use client";

import { useCallback, useMemo, useState } from "react";
import { adminPut, AdminApiError } from "@/lib/admin-client";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { SaveBar } from "./ui/save-bar";
import { useSaveHotkey, useUnsavedChanges } from "./use-unsaved-changes";

type NavItem = {
  id?: string;
  label: string;
  href: string;
  kind: "INTERNAL" | "EXTERNAL";
  enabled: boolean;
  sortOrder: number;
  children?: NavItem[];
};

const DEFAULT_HEADER: NavItem[] = [
  { label: "A marca", href: "/a-marca", kind: "INTERNAL", enabled: true, sortOrder: 0 },
  { label: "Coleções", href: "/colecoes", kind: "INTERNAL", enabled: true, sortOrder: 1 },
  { label: "Contato", href: "/contato", kind: "INTERNAL", enabled: true, sortOrder: 2 },
];

function normalizeItems(items: unknown): NavItem[] {
  if (!Array.isArray(items)) return DEFAULT_HEADER;
  return items.map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      id: typeof row.id === "string" ? row.id : undefined,
      label: String(row.label ?? ""),
      href: String(row.href ?? "/"),
      kind: row.kind === "EXTERNAL" ? "EXTERNAL" : "INTERNAL",
      enabled: row.enabled !== false,
      sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : index,
      children: Array.isArray(row.children) ? normalizeItems(row.children) : [],
    };
  });
}

export function NavigationForm({
  headerItems,
  footerItems,
}: {
  headerItems?: unknown;
  footerItems?: unknown;
}) {
  const [header, setHeader] = useState<NavItem[]>(normalizeItems(headerItems ?? DEFAULT_HEADER));
  const [footer, setFooter] = useState<NavItem[]>(normalizeItems(footerItems ?? []));
  const [baseline, setBaseline] = useState(() => JSON.stringify({ header: normalizeItems(headerItems ?? DEFAULT_HEADER), footer: normalizeItems(footerItems ?? []) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const snapshot = useMemo(() => JSON.stringify({ header, footer }), [header, footer]);
  const dirty = snapshot !== baseline;
  useUnsavedChanges(dirty);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      await adminPut("/v1/admin/navigation/header", { key: "header", name: "Header", items: header });
      if (footer.length > 0) {
        await adminPut("/v1/admin/navigation/footer", { key: "footer", name: "Footer", items: footer });
      }
      setBaseline(snapshot);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Não foi possível salvar a navegação.");
    } finally {
      setSaving(false);
    }
  }, [header, footer, snapshot]);

  useSaveHotkey(dirty, () => void save());

  return (
    <div className="grid max-w-3xl gap-6">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <MenuEditor title="Header" items={header} onChange={setHeader} />
      <MenuEditor title="Rodapé" items={footer} onChange={setFooter} allowEmpty />
      <SaveBar dirty={dirty} saving={saving} lastSavedAt={savedAt} hidePublish saveDraftLabel="Salvar navegação" onSaveDraft={() => void save()} onPublish={() => void save()} />
    </div>
  );
}

function MenuEditor({
  title,
  items,
  onChange,
  allowEmpty,
}: {
  title: string;
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
  allowEmpty?: boolean;
}) {
  function update(index: number, patch: Partial<NavItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  return (
    <FormSection title={title} description="Links visíveis no site público. URLs internas começam com /.">
      {items.length === 0 && allowEmpty ? <p className="text-sm text-foreground-muted">Nenhum link no rodapé.</p> : null}
      {items.map((item, index) => (
        <div key={`${item.href}-${index}`} className="grid gap-2 border border-border p-3 sm:grid-cols-2">
          <Field label="Rótulo">
            <input className={fieldClass} value={item.label} onChange={(e) => update(index, { label: e.target.value })} />
          </Field>
          <Field label="URL">
            <input className={fieldClass} value={item.href} onChange={(e) => update(index, { href: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={item.enabled} onChange={(e) => update(index, { enabled: e.target.checked })} />
            Visível
          </label>
          <button type="button" className="justify-self-start text-xs underline text-danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>
            Remover
          </button>
        </div>
      ))}
      <button
        type="button"
        className="justify-self-start border border-border px-3 py-1.5 text-sm"
        onClick={() => onChange([...items, { label: "", href: "/", kind: "INTERNAL", enabled: true, sortOrder: items.length }])}
      >
        Adicionar link
      </button>
    </FormSection>
  );
}
