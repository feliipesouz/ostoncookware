import { apiRouteHandlers } from "@/lib/dispatch-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = apiRouteHandlers;
