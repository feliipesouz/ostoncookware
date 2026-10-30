"use client";

import { adminMutate } from "@/lib/admin-client";
import { useRef, useState, type FormEvent } from "react";

type User = { id: string; name: string; email: string; role: string };

export function UsersTable({ initial, canWrite }: { initial: User[]; canWrite: boolean }) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState("EDITOR");
  const formRef = useRef<HTMLFormElement>(null);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setMessage("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      const result = await adminMutate<{ data: User }>("/v1/admin/users", "POST", {
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim().toLowerCase(),
        password: String(form.get("password") ?? ""), role,
      });
      setRows((current) => [...current, result.data]);
      formRef.current?.reset();
      setRole("EDITOR");
      setCreating(false);
      setSuccess(`Acesso de ${result.data.name} criado. A pessoa já pode entrar com o e-mail e a senha cadastrados.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o acesso.");
    } finally { setBusy(false); }
  }

  async function changeRole(id: string, role: string) {
    if (busy) return;
    setMessage("");
    setSuccess("");
    setBusy(true);
    try {
      const result = await adminMutate<{ data: User }>(`/v1/admin/users/${id}`, "PATCH", { role });
      setRows((current) => current.map((row) => (row.id === id ? result.data : row)));
      setSuccess("Permissões atualizadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar o papel.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-foreground-muted">{rows.length} {rows.length === 1 ? "pessoa com acesso" : "pessoas com acesso"}</p>
        {canWrite ? <button type="button" disabled={busy} aria-expanded={creating} aria-controls="new-user-form" onClick={() => { setCreating((value) => !value); setRole("EDITOR"); setMessage(""); setSuccess(""); }} className="min-h-11 bg-foreground px-4 py-2 text-sm text-foreground-inverse disabled:opacity-50">Novo usuário</button> : <p className="text-sm text-foreground-muted">Somente o proprietário pode criar acessos e alterar permissões.</p>}
      </div>
      {success ? <p role="status" className="mt-4 border border-border bg-surface p-3 text-sm">{success}</p> : null}
      {canWrite && creating ? <form ref={formRef} id="new-user-form" onSubmit={createUser} className="mt-5 border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-medium">Adicionar uma pessoa</h2>
        <p className="mt-2 text-sm text-foreground-muted">Cada pessoa usa seu próprio login. Cadastre a senha de acesso e compartilhe os dados diretamente com ela.</p>
        <fieldset disabled={busy} className="mt-5 grid gap-4 disabled:opacity-60 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">Nome<input name="name" required minLength={2} maxLength={120} autoComplete="off" className="min-h-11 border border-border bg-background px-3 py-2" /></label>
          <label className="grid gap-2 text-sm">E-mail<input name="email" type="email" required maxLength={254} autoComplete="off" className="min-h-11 border border-border bg-background px-3 py-2" /></label>
          <label className="grid gap-2 text-sm">Senha<input name="password" aria-label="Senha" type="password" required minLength={12} maxLength={128} autoComplete="new-password" aria-describedby="new-password-help" className="min-h-11 border border-border bg-background px-3 py-2" /><span id="new-password-help" className="text-xs text-foreground-muted">Use entre 12 e 128 caracteres.</span></label>
          <label className="grid content-start gap-2 text-sm">Confirmar senha<input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="min-h-11 border border-border bg-background px-3 py-2" /></label>
          <label className="grid gap-2 text-sm sm:col-span-2">Perfil de acesso<select name="role" aria-label="Perfil de acesso" value={role} onChange={(event) => setRole(event.target.value)} aria-describedby="new-user-role-help" className="min-h-11 border border-border bg-background px-3 py-2"><option value="EDITOR">Editor</option><option value="ADMIN">Administrador</option></select><span id="new-user-role-help" className="text-xs leading-relaxed text-foreground-muted">{role === "EDITOR" ? "Edita o conteúdo do site e consulta leads. Não gerencia usuários nem altera configurações gerais." : "Gerencia conteúdo, leads e configurações, além de consultar a auditoria. Não cria usuários nem altera permissões."}</span></label>
          <div className="flex flex-wrap gap-3 pt-2 sm:col-span-2"><button type="submit" className="min-h-11 bg-foreground px-5 py-2 text-sm text-foreground-inverse">{busy ? "Criando acesso…" : "Criar acesso"}</button><button type="button" className="min-h-11 border border-border px-4 py-2 text-sm" onClick={() => { formRef.current?.reset(); setCreating(false); setRole("EDITOR"); setMessage(""); }}>Cancelar</button></div>
        </fieldset>
      </form> : null}
      {message ? <p role="alert" className="mt-4 text-sm text-danger">{message}</p> : null}
      <div className="mt-6 overflow-x-auto border border-border"><table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-surface text-foreground-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Nome</th>
            <th scope="col" className="px-4 py-3">E-mail</th>
            <th scope="col" className="px-4 py-3">Perfil de acesso</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="px-4 py-3">{user.name}</td>
              <td className="break-all px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                {canWrite && user.role !== "OWNER" ? (
                  <select
                    aria-label={`Perfil de ${user.name}`}
                    disabled={busy}
                    className="min-h-11 border border-border bg-background px-2 py-1 disabled:opacity-50"
                    value={user.role}
                    onChange={(event) => void changeRole(user.id, event.target.value)}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                ) : (
                  ({ OWNER: "Proprietário", ADMIN: "Administrador", EDITOR: "Editor" } as Record<string, string>)[user.role] ?? user.role
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );
}
