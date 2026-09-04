import { cookies } from "next/headers";
import { dispatchApi } from "@/lib/dispatch-api";

export async function adminFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("cookie")) {
    headers.set("cookie", (await cookies()).toString());
  }
  return dispatchApi(path, { ...init, headers });
}

export async function adminGet<T>(path: string): Promise<T> {
  const response = await adminFetch(path);
  if (!response.ok) {
    throw new Error(`Admin GET ${path} failed`);
  }
  return response.json() as Promise<T>;
}

export async function adminGetOptional<T>(path: string): Promise<T | null> {
  try {
    return await adminGet<T>(path);
  } catch {
    return null;
  }
}

export type AdminPage<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
};

export function emptyPage<T>(): AdminPage<T> {
  return { data: [], meta: { page: 1, pageSize: 20, total: 0, pageCount: 1 } };
}
