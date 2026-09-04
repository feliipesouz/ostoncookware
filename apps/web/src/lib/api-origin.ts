import type { NextRequest } from "next/server";

export function apiOrigin(request?: NextRequest) {
  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  const explicit = process.env.API_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }

  return request?.nextUrl.origin ?? "http://localhost:3000";
}
