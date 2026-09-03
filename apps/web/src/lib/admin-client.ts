"use client";

export type AdminProblem = {
  type?: string;
  title?: string;
  detail?: string;
  code?: string;
  status?: number;
  instance?: string;
  correlationId?: string;
  actorName?: string;
  updatedByName?: string;
  updatedAt?: string;
  currentVersion?: number;
  meta?: {
    updatedBy?: string | null;
    updatedAt?: string | null;
    currentVersion?: number;
  };
  errors?: { path?: string; message?: string }[];
};

export class AdminApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: string;
  readonly title: string;
  readonly payload: AdminProblem;

  constructor(payload: AdminProblem, status: number) {
    const title = payload.title ?? "Não foi possível salvar.";
    const detail = payload.detail;
    super(detail && detail !== title ? `${title} ${detail}` : title);
    this.name = "AdminApiError";
    this.status = payload.status ?? status;
    this.code = payload.code;
    this.detail = detail;
    this.title = title;
    this.payload = payload;
  }
}

export function isVersionConflict(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError && error.status === 409 && error.code === "VERSION_CONFLICT";
}

export function conflictActor(error: AdminApiError) {
  return (
    error.payload.updatedByName ??
    error.payload.actorName ??
    error.payload.meta?.updatedBy ??
    "outra pessoa"
  );
}

export function conflictAt(error: AdminApiError) {
  return error.payload.updatedAt ?? error.payload.meta?.updatedAt ?? null;
}

function errorMessage(error: unknown) {
  if (error instanceof AdminApiError) {
    return error.detail && error.detail !== error.title ? `${error.title} ${error.detail}` : error.title;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Não foi possível salvar.";
}

export function adminErrorMessage(error: unknown) {
  return errorMessage(error);
}

export async function adminMutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as AdminProblem;
    throw new AdminApiError(payload, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function adminPut<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return adminMutate<T>(path, "PUT", body);
}
