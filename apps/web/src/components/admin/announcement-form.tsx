"use client";

import { useState } from "react";
import { adminMutate } from "@/lib/admin-client";
import { confirmDestructive } from "@/lib/environment";

type Announcement = {
  id?: string;
  message: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export function AnnouncementForm({
  items,
}: {
  items: Announcement[];
}) {
  const current = items[0];
  const [form, setForm] = useState<Announcement>({
    id: current?.id,
    message: current?.message ?? "",
    ctaLabel: current?.ctaLabel ?? "",
    ctaUrl: current?.ctaUrl ?? "",
    active: current?.active ?? false,
    startsAt: current?.startsAt ? current.startsAt.slice(0, 16) : "",
    endsAt: current?.endsAt ? current.endsAt.slice(0, 16) : "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      message: form.message,
      ctaLabel: form.ctaLabel || null,
      ctaUrl: form.ctaUrl || null,
      active: form.active,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    try {
      const result = form.id
        ? await adminMutate<{ data: Announcement }>(`/v1/admin/announcements/${form.id}`, "PUT", payload)
        : await adminMutate<{ data: Announcement }>("/v1/admin/announcements", "POST", payload);
      setForm({
        ...result.data,
        startsAt: result.data.startsAt ? String(result.data.startsAt).slice(0, 16) : "",
        endsAt: result.data.endsAt ? String(result.data.endsAt).slice(0, 16) : "",
      });
      setMessage("Anúncio salvo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  async function deactivate() {
    if (!form.id || !confirmDestructive("Desativar este anúncio agora?")) return;
    await adminMutate(`/v1/admin/announcements/${form.id}/deactivate`, "POST");
    setForm((currentForm) => ({ ...currentForm, active: false }));
    setMessage("Anúncio desativado.");
  }

  return (
    <form onSubmit={save} className="mt-8 grid max-w-2xl gap-4">
      <label className="grid gap-1 text-sm">
        Mensagem
        <input
          className="border border-border px-3 py-2"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          maxLength={240}
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Rótulo do botão
          <input
            className="border border-border px-3 py-2"
            value={form.ctaLabel ?? ""}
            onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          URL do botão
          <input
            className="border border-border px-3 py-2"
            value={form.ctaUrl ?? ""}
            onChange={(event) => setForm({ ...form, ctaUrl: event.target.value })}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Início
          <input
            type="datetime-local"
            className="border border-border px-3 py-2"
            value={form.startsAt ?? ""}
            onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Fim
          <input
            type="datetime-local"
            className="border border-border px-3 py-2"
            value={form.endsAt ?? ""}
            onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
        Ativo (respeita o intervalo de datas)
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <div className="flex gap-3">
        <button className="bg-foreground px-5 py-2 text-foreground-inverse">Salvar anúncio</button>
        {form.id ? (
          <button type="button" onClick={deactivate} className="border border-border px-5 py-2">
            Desativar
          </button>
        ) : null}
      </div>
    </form>
  );
}
