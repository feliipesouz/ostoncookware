"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (!response.ok) {
        setLoading(false);
        setError(
          response.status >= 500
            ? "Não foi possível autenticar agora. Tente de novo em instantes."
            : "E-mail ou senha inválidos.",
        );
        return;
      }
    } catch {
      setLoading(false);
      setError("Não foi possível autenticar agora. Tente de novo em instantes.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">OSTON CMS</p>
      <h1 className="mt-4 text-3xl">Entrar</h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2 text-sm">
          E-mail
          <input name="email" type="email" required className="border border-border px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          Senha
          <input name="password" type="password" required minLength={10} className="border border-border px-3 py-3" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" disabled={loading} className="bg-foreground py-3 text-foreground-inverse">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
