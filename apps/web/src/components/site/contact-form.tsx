"use client";

import { useState } from "react";
import type { Collection } from "@/lib/content";

export function ContactForm({ collections }: { collections: Collection[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/v1/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          city: data.get("city"),
          state: data.get("state"),
          interest: data.get("interest") || "CONSULTANT",
          collectionId: data.get("collectionId") || undefined,
          message: data.get("message"),
          website: data.get("website"),
          source: "contact-form",
          landingPage: window.location.pathname,
          utmSource: new URLSearchParams(window.location.search).get("utm_source"),
          utmMedium: new URLSearchParams(window.location.search).get("utm_medium"),
          utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign"),
          utmContent: new URLSearchParams(window.location.search).get("utm_content"),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha no envio");
      }

      setStatus("success");
      setMessage("Recebemos o seu contato. Um consultor retorna em breve.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Não foi possível enviar. Tente novamente ou use o WhatsApp.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Field label="Nome" name="name" required />
      <Field label="Telefone" name="phone" type="tel" required autoComplete="tel" />
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Cidade" name="city" />
        <Field label="Estado" name="state" />
      </div>
      <label className="grid gap-2 text-sm">
        <span>Interesse</span>
        <select name="interest" className="border border-border bg-surface px-3 py-3">
          <option value="CONSULTANT">Falar com consultor</option>
          <option value="COLLECTION">Uma coleção específica</option>
          <option value="CATALOG">Catálogo</option>
          <option value="OTHER">Outro</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span>Coleção</span>
        <select name="collectionId" className="border border-border bg-surface px-3 py-3">
          <option value="">Selecione se quiser</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span>Mensagem</span>
        <textarea name="message" rows={5} className="border border-border bg-surface px-3 py-3" />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-foreground px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase text-foreground-inverse disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Enviar conversa"}
      </button>
      {message ? (
        <p role="status" className={status === "error" ? "text-danger" : "text-success"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const id = name;
  return (
    <label className="grid gap-2 text-sm" htmlFor={id}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="border border-border bg-surface px-3 py-3"
      />
    </label>
  );
}
