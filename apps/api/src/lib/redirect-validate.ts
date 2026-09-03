import { isSafeCtaUrl } from "@oston/contracts";
import { HttpError } from "./errors.js";

const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;
const BLOCKED_PREFIXES = ["/admin", "/api", "/v1"];

export type RedirectPair = {
  sourcePath: string;
  destination: string;
  active?: boolean;
};

export function normalizeRedirectPath(input: string, kind: "source" | "destination") {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new HttpError(400, kind === "source" ? "Informe o caminho de origem." : "Informe o destino.", {
      code: "INVALID_REDIRECT",
    });
  }
  if (DANGEROUS_SCHEMES.test(trimmed)) {
    throw new HttpError(400, "URL de redirecionamento inválida.", { code: "INVALID_REDIRECT" });
  }
  if (trimmed.startsWith("//")) {
    throw new HttpError(400, "Caminhos protocol-relative não são permitidos.", { code: "INVALID_REDIRECT" });
  }

  if (kind === "destination" && /^https?:\/\//i.test(trimmed)) {
    if (!isSafeCtaUrl(trimmed)) {
      throw new HttpError(400, "URL de destino inválida. Use um caminho interno ou http(s).", {
        code: "INVALID_REDIRECT",
      });
    }
    return trimmed;
  }

  let path = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    path = new URL(trimmed).pathname;
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  path = path.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (path.length > 1) {
    path = path.replace(/\/$/, "");
  }
  if (path.includes("\0")) {
    throw new HttpError(400, "Caminho de redirecionamento inválido.", { code: "INVALID_REDIRECT" });
  }

  const lower = path.toLowerCase();
  if (BLOCKED_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`))) {
    throw new HttpError(400, "Não é permitido redirecionar caminhos administrativos ou da API.", {
      code: "INVALID_REDIRECT",
    });
  }

  return path;
}

export function wouldCreateLoop(sourcePath: string, destination: string, existing: RedirectPair[] = []) {
  if (sourcePath === destination) {
    return true;
  }

  const active = existing.filter((row) => row.active !== false);
  const seen = new Set<string>();
  let current = destination;

  while (current) {
    if (current === sourcePath) {
      return true;
    }
    if (seen.has(current)) {
      break;
    }
    seen.add(current);
    const next = active.find((row) => row.sourcePath === current);
    current = next?.destination ?? "";
  }

  return false;
}

export function validateRedirect(input: {
  sourcePath: string;
  destination: string;
  existing?: RedirectPair[];
}) {
  const sourcePath = normalizeRedirectPath(input.sourcePath, "source");
  const destination = normalizeRedirectPath(input.destination, "destination");

  if (sourcePath === destination) {
    throw new HttpError(400, "A origem e o destino do redirecionamento não podem ser iguais.", {
      code: "INVALID_REDIRECT",
    });
  }
  if (wouldCreateLoop(sourcePath, destination, input.existing ?? [])) {
    throw new HttpError(400, "Este redirecionamento criaria um loop.", { code: "INVALID_REDIRECT" });
  }

  return { sourcePath, destination };
}
