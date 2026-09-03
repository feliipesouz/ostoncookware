"use client";

import Link from "next/link";
import { useState } from "react";
import { adminMutate } from "@/lib/admin-client";

type LeadDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  interest: string;
  collectionName: string | null;
  message: string | null;
  source: string | null;
  landingPage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  status: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  tags: string[];
  createdAt: string;
  notes: { id: string; content: string; authorName: string | null; createdAt: string }[];
  activities: { id: string; message: string; createdAt: string }[];
  possibleDuplicates: { id: string; name: string; phone: string; email: string | null; createdAt: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contactado",
  QUALIFIED: "Qualificado",
  WON: "Ganho",
  LOST: "Perdido",
};

export function LeadDetail({
  initial,
  users,
  canWrite,
}: {
  initial: LeadDetail;
  users: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const [lead, setLead] = useState(initial);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const result = await adminMutate<{ data: LeadDetail }>(`/v1/admin/leads/${lead.id}`, "PATCH", body);
      setLead((current) => ({ ...current, ...result.data }));
      const refreshed = await fetch(`/v1/admin/leads/${lead.id}`, { credentials: "include" });
      if (refreshed.ok) {
        const payload = (await refreshed.json()) as { data: LeadDetail };
        setLead(payload.data);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      await adminMutate(`/v1/admin/leads/${lead.id}/notes`, "POST", { content: note.trim() });
      setNote("");
      const refreshed = await fetch(`/v1/admin/leads/${lead.id}`, { credentials: "include" });
      if (refreshed.ok) {
        const payload = (await refreshed.json()) as { data: LeadDetail };
        setLead(payload.data);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível adicionar a nota.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-sm text-foreground-muted">
          <Link href="/admin/leads" className="underline">
            Leads
          </Link>{" "}
          / {lead.name}
        </p>
        <h1 className="mt-2 text-3xl">{lead.name}</h1>
        {lead.possibleDuplicates.length > 0 ? (
          <div className="mt-4 border border-border bg-surface p-4 text-sm">
            <p className="font-medium">Possíveis duplicados</p>
            <p className="mt-1 text-foreground-muted">
              Encontramos outros leads com o mesmo telefone ou e-mail. Nada foi mesclado automaticamente.
            </p>
            <ul className="mt-3 grid gap-1">
              {lead.possibleDuplicates.map((item) => (
                <li key={item.id}>
                  <Link className="underline" href={`/admin/leads/${item.id}`}>
                    {item.name}
                  </Link>{" "}
                  · {item.phone} · {item.email ?? "sem e-mail"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Telefone" value={lead.phone} />
          <Field label="E-mail" value={lead.email} />
          <Field label="Cidade" value={lead.city} />
          <Field label="Estado" value={lead.state} />
          <Field label="Interesse" value={lead.interest} />
          <Field label="Coleção" value={lead.collectionName} />
          <Field label="Origem" value={lead.source} />
          <Field label="Página" value={lead.landingPage} />
          <Field label="UTM Source" value={lead.utmSource} />
          <Field label="UTM Medium" value={lead.utmMedium} />
          <Field label="UTM Campaign" value={lead.utmCampaign} />
          <Field label="UTM Content" value={lead.utmContent} />
          <Field label="Criado em" value={new Date(lead.createdAt).toLocaleString("pt-BR")} />
        </dl>
        {lead.message ? (
          <section className="mt-6">
            <h2 className="text-lg">Mensagem</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{lead.message}</p>
          </section>
        ) : null}

        <section className="mt-8 grid gap-3">
          <label className="grid gap-1 text-sm">
            Status
            <select
              value={lead.status}
              disabled={!canWrite || busy}
              className="border border-border px-3 py-2"
              onChange={(event) => void patch({ status: event.target.value })}
            >
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Responsável
            <select
              value={lead.assignedToId ?? ""}
              disabled={!canWrite || busy}
              className="border border-border px-3 py-2"
              onChange={(event) => void patch({ assignedToId: event.target.value || null })}
            >
              <option value="">Sem responsável</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Tags
            <input
              value={tags}
              disabled={!canWrite || busy}
              className="border border-border px-3 py-2"
              placeholder="vip, consultora, imperial"
              onChange={(event) => setTags(event.target.value)}
              onBlur={() => {
                const next = tags
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean);
                if (next.join(",") !== lead.tags.join(",")) void patch({ tags: next });
              }}
            />
          </label>
        </section>
        {message ? <p className="mt-4 text-sm text-foreground-muted">{message}</p> : null}
      </div>

      <aside>
        <h2 className="text-lg">Notas</h2>
        <ul className="mt-4 divide-y divide-border text-sm">
          {lead.notes.length === 0 ? (
            <li className="py-4 text-foreground-muted">Nenhuma nota ainda.</li>
          ) : (
            lead.notes.map((item) => (
              <li key={item.id} className="py-3">
                <p>{item.content}</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {item.authorName ?? "Equipe"} · {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>
              </li>
            ))
          )}
        </ul>
        {canWrite ? (
          <div className="mt-4 grid gap-2">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-28 border border-border px-3 py-2 text-sm"
              placeholder="Adicionar nota (somente acréscimo)"
            />
            <button
              type="button"
              disabled={busy || !note.trim()}
              className="bg-foreground px-4 py-2 text-sm text-foreground-inverse disabled:opacity-50"
              onClick={() => void addNote()}
            >
              Registrar nota
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-foreground-muted">Notas são somente leitura para o seu perfil.</p>
        )}

        <h2 className="mt-10 text-lg">Linha do tempo</h2>
        <ol className="mt-4 divide-y divide-border text-sm">
          {lead.activities.length === 0 ? (
            <li className="py-4 text-foreground-muted">Sem atividades.</li>
          ) : (
            lead.activities.map((item) => (
              <li key={item.id} className="py-3">
                <p>{item.message}</p>
                <p className="mt-1 text-xs text-foreground-muted">{new Date(item.createdAt).toLocaleString("pt-BR")}</p>
              </li>
            ))
          )}
        </ol>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.16em] text-foreground-muted">{label}</dt>
      <dd className="mt-1">{value || "—"}</dd>
    </div>
  );
}
