"use client";

import { adminMutate } from "@/lib/admin-client";
import { useState } from "react";

type User = { id: string; name: string; email: string; role: string };

export function UsersTable({ initial, canWrite }: { initial: User[]; canWrite: boolean }) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState("");

  async function changeRole(id: string, role: string) {
    setMessage("");
    try {
      const result = await adminMutate<{ data: User }>(`/v1/admin/users/${id}`, "PATCH", { role });
      setRows((current) => current.map((row) => (row.id === id ? result.data : row)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar o papel.");
    }
  }

  return (
    <>
      {message ? <p className="mt-4 text-sm text-danger">{message}</p> : null}
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-foreground-muted">
          <tr>
            <th className="py-3">Nome</th>
            <th>E-mail</th>
            <th>Papel</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="py-3">{user.name}</td>
              <td>{user.email}</td>
              <td>
                {canWrite && user.role !== "OWNER" ? (
                  <select
                    className="border border-border px-2 py-1"
                    value={user.role}
                    onChange={(event) => void changeRole(user.id, event.target.value)}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
