"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Collection } from "@/lib/content";
import type { ConsultationContext } from "@/lib/catalog";
import { readLeadAttribution } from "@/lib/lead-attribution";

const emptyContext: ConsultationContext = { message: "", source: "contact-form", path: "/contato" };

export function ContactForm({ collections, context = emptyContext, privacyUrl }: {
  collections: Collection[];
  context?: ConsultationContext;
  privacyUrl?: string | null;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const feedback = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (status === "error" || status === "success") feedback.current?.focus();
  }, [status]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Informe seu nome com pelo menos 2 caracteres.";
    const phoneLength = phone.replace(/\D/g, "").length;
    if (phoneLength < 10 || phoneLength > 15) errors.phone = "Informe um telefone válido, com DDD e 10 a 15 dígitos.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("error");
      setMessage("Não foi possível enviar. Confira os campos indicados.");
      return;
    }
    busy.current = true;
    setStatus("loading");
    setMessage("");

    const attribution = readLeadAttribution();

    try {
      const response = await fetch("/v1/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: String(data.get("email") ?? "").trim(),
          phone,
          city: String(data.get("city") ?? "").trim(),
          state: String(data.get("state") ?? "").trim(),
          interest: data.get("interest") || "CONSULTANT",
          collectionId: data.get("collectionId") || undefined,
          message: String(data.get("message") ?? "").trim(),
          website: data.get("website") || undefined,
          source: context.source,
          landingPage: attribution.landingPage ?? context.path,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmContent: attribution.utmContent,
        }),
      });

      if (!response.ok) {
        setStatus("error");
        if (response.status === 429) {
          setMessage("Foram feitas várias tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.");
        } else if (response.status === 400) {
          setMessage("Não foi possível enviar. Confira seus dados e tente novamente.");
        } else {
          setMessage("Não foi possível enviar agora. Seus dados foram mantidos; tente novamente em instantes.");
        }
        return;
      }

      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("Não foi possível enviar. Verifique sua conexão e tente novamente; seus dados foram mantidos.");
    } finally {
      busy.current = false;
    }
  }

  if (status === "success") {
    return (
      <div ref={feedback} tabIndex={-1} className="surface-panel p-8 md:p-10">
        <p className="eyebrow">Mensagem recebida</p>
        <h2 className="font-display mt-5 text-4xl">Sua escolha está<br />em boas conversas.</h2>
        <p className="mt-5 text-sm leading-8 text-foreground-muted">Sua solicitação foi enviada à equipe OSTON. Enquanto isso, continue explorando as coleções.</p>
        <Link href="/colecoes" className="button-primary mt-8">Explorar coleções <span aria-hidden="true">↗</span></Link>
        <button type="button" onClick={() => { setStatus("idle"); setMessage(""); }} className="mt-5 block min-h-11 text-xs underline underline-offset-4">Enviar outra mensagem</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-busy={status === "loading"} className="surface-panel p-6 md:p-10">
      <div className="mb-7">
        <p className="eyebrow">Vamos conversar</p>
        <h2 className="font-display mt-3 text-3xl">Conte o que você procura.</h2>
        <p className="mt-3 text-xs leading-6 text-foreground-muted">Nome e telefone são necessários. Os demais campos ajudam a orientar o atendimento.</p>
      </div>
      {context.productName || context.collectionName ? (
        <div className="mb-7 border-l-2 border-brand pl-4">
          <p className="text-xs text-foreground-muted">Seu interesse</p>
          <p className="mt-1 text-sm">{context.productName ?? context.collectionName}</p>
        </div>
      ) : null}
      <fieldset disabled={status === "loading"} className="grid min-w-0 gap-5">
        <legend className="sr-only">Informações para contato</legend>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" maxLength={200} />
        </div>
        <Field label="Nome" name="name" required autoComplete="name" maxLength={120} error={fieldErrors.name} />
        <Field label="Telefone com DDD" name="phone" type="tel" required autoComplete="tel" maxLength={32} placeholder="(11) 99999-9999" error={fieldErrors.phone} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" maxLength={254} />
        <details className="border-y border-border py-4">
          <summary className="cursor-pointer text-sm">Adicionar cidade e estado <span className="text-xs text-foreground-muted">(opcional)</span></summary>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Cidade" name="city" autoComplete="address-level2" maxLength={80} />
            <Field label="Estado" name="state" autoComplete="address-level1" maxLength={40} />
          </div>
        </details>
        <label className="grid gap-2 text-sm">
          <span>Como podemos ajudar?</span>
          <select name="interest" defaultValue={context.collectionId ? "COLLECTION" : "CONSULTANT"} className="min-h-12 border border-border-strong bg-background px-3">
            <option value="CONSULTANT">Quero orientação para escolher</option>
            <option value="COLLECTION">Tenho interesse em uma coleção</option>
            <option value="CATALOG">Quero conhecer o catálogo</option>
            <option value="OTHER">Outro assunto</option>
          </select>
        </label>
        {collections.length ? (
          <label className="grid gap-2 text-sm">
            <span>Coleção de interesse</span>
            <select name="collectionId" defaultValue={context.collectionId ?? ""} className="min-h-12 border border-border-strong bg-background px-3">
              <option value="">Ainda estou escolhendo</option>
              {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm">
          <span>Sua mensagem</span>
          <textarea name="message" rows={4} maxLength={2000} defaultValue={context.message} placeholder="O que você gostaria de saber sobre o seu conjunto?" className="border border-border-strong bg-background px-3 py-3 leading-7" />
        </label>
        <button type="submit" className="button-primary w-full disabled:cursor-wait disabled:opacity-60">
          {status === "loading" ? "Enviando solicitação…" : "Enviar solicitação"} <span aria-hidden="true">↗</span>
        </button>
        {privacyUrl ? <p className="text-xs leading-6 text-foreground-muted">Saiba como seus dados são tratados na <a href={privacyUrl} className="underline underline-offset-4">Política de Privacidade</a>.</p> : null}
      </fieldset>
      {message ? (
        <div ref={feedback} role="alert" tabIndex={-1} className="mt-5 border border-danger/30 bg-background p-4 text-sm leading-7 text-danger">{message}</div>
      ) : null}
    </form>
  );
}

function Field({ label, name, type = "text", required, autoComplete, maxLength, placeholder, error }: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  maxLength: number;
  placeholder?: string;
  error?: string;
}) {
  const id = "contact-" + name;
  return (
    <label className="grid gap-2 text-sm" htmlFor={id}>
      <span>{label}{required ? " *" : ""}</span>
      <input id={id} name={name} type={type} required={required} autoComplete={autoComplete} maxLength={maxLength} placeholder={placeholder}
        aria-invalid={error ? true : undefined} aria-describedby={error ? id + "-error" : undefined}
        className="min-h-12 border border-border-strong bg-background px-3 py-3" />
      {error ? <span id={id + "-error"} className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
