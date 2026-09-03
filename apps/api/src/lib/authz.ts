import type { UserRole } from "@oston/contracts";
import { HttpError } from "./errors.js";

const permissions = {
  "content:read": ["OWNER", "ADMIN", "EDITOR"],
  "content:write": ["OWNER", "ADMIN", "EDITOR"],
  "leads:read": ["OWNER", "ADMIN", "EDITOR"],
  "leads:write": ["OWNER", "ADMIN"],
  "settings:read": ["OWNER", "ADMIN", "EDITOR"],
  "settings:write": ["OWNER", "ADMIN"],
  "users:read": ["OWNER", "ADMIN"],
  "users:write": ["OWNER"],
  "audit:read": ["OWNER", "ADMIN"],
  "leads:export": ["OWNER", "ADMIN"],
  "redirects:write": ["OWNER", "ADMIN"],
  "system:read": ["OWNER", "ADMIN"],
  "content:delete": ["OWNER", "ADMIN"],
} as const;

export type Permission = keyof typeof permissions;

export function can(role: UserRole, permission: Permission) {
  return (permissions[permission] as readonly string[]).includes(role);
}

export function assertCan(role: UserRole, permission: Permission) {
  if (!can(role, permission)) {
    throw new HttpError(403, "Você não tem permissão para esta ação.", {
      code: "FORBIDDEN",
    });
  }
}

export function assertRole(role: string | null | undefined): UserRole {
  if (role === "OWNER" || role === "ADMIN" || role === "EDITOR") {
    return role;
  }

  throw new HttpError(403, "Perfil de acesso inválido.", { code: "FORBIDDEN" });
}
