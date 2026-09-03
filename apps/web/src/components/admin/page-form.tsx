"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminMutate } from "@/lib/admin-client";
import { PreviewButton } from "./preview-button";

export function PageForm({
  id,
  initial,
}: {
  id?: string;
  initial?: {
    slug: string;
    title: string;
    eyebrow: string | null;
    body: string;
    status: string;
    seoTitle: string | null;
    seoDescription: string | null;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: initial?.slug ?? "a-marca",
    title: initial?.title ?? "",
    eyebrow: initial?.eyebrow ?? "",
    body: initial?.body ?? "",
    status: initial?.status ?? "DRAFT",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        eyebrow: form.eyebrow || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
      };
      if (id) {
        await adminMutate(`/v1/admin/pages/${id}`, "PUT", payload);
      } else {
        await adminMutate("/v1/admin/pages", "POST", payload);
      }
      router.push("/admin/paginas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-4">
      <label className="grid gap-1 text-sm">
        Slug
        <input className="border border-border px-3 py-2" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        Eyebrow
        <input className="border border-border px-3 py-2" value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        Título
        <input className="border border-border px-3 py-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        Corpo (parágrafos separados por linha em branco)
        <textarea
          rows={12}
          className="border border-border px-3 py-2"
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Status
        <select className="border border-border px-3 py-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option>DRAFT</option>
          <option>SCHEDULED</option>
          <option>PUBLISHED</option>
          <option>ARCHIVED</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        SEO title
        <input className="border border-border px-3 py-2" value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        SEO description
        <textarea className="border border-border px-3 py-2" value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button disabled={saving} className="bg-foreground px-5 py-2 text-foreground-inverse">
          {saving ? "Salvando…" : "Salvar página"}
        </button>
        {form.slug ? <PreviewButton type="page" slug={form.slug} path={`/${form.slug === "a-marca" ? "a-marca" : form.slug}`} /> : null}
      </div>
    </form>
  );
}
