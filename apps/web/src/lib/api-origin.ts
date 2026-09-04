import type { NextRequest } from "next/server";

export function apiOrigin(request?: NextRequest) {
  if (request) {
    return request.nextUrl.origin;
  }

  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  return process.env.API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
