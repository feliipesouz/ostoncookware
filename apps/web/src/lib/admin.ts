import { cookies } from "next/headers";

const API = () => process.env.API_URL ?? "http://localhost:4000";

export async function adminGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API()}${path}`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
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
