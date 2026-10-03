const STORAGE_KEY = "oston.lead-attribution.v1";
const MAX_AGE_MS = 30 * 60 * 1000;
const UTM_FIELDS = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
] as const;

type UtmField = (typeof UTM_FIELDS)[number][1];
export type LeadAttribution = Partial<Record<UtmField, string>> & { landingPage?: string };

function publicPath(path: string) {
  return path.length <= 240 && /^\/(?:colecoes(?:\/[a-z0-9-]+)?|produtos\/[a-z0-9-]+|a-marca|contato)?$/.test(path);
}

function parameter(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) || undefined : undefined;
}

function fromLocation(path: string, search: string): LeadAttribution {
  if (!publicPath(path)) return {};
  const params = new URLSearchParams(search);
  const attribution: LeadAttribution = {};
  for (const [query, field] of UTM_FIELDS) {
    const value = parameter(params.get(query));
    if (value) attribution[field] = value;
  }
  return Object.keys(attribution).length ? { ...attribution, landingPage: path } : {};
}

/** Mantém UTMs e o caminho público na aba; a atribuição é válida por 30 minutos. */
export function captureLeadAttribution(path: string, search: string) {
  if (typeof window === "undefined") return;
  const attribution = fromLocation(path, search);
  if (!attribution.landingPage) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...attribution, recordedAt: Date.now() }));
  } catch {
    // A consulta continua funcionando se o navegador bloquear armazenamento.
  }
}

export function readLeadAttribution(): LeadAttribution {
  if (typeof window === "undefined") return {};
  const current = fromLocation(window.location.pathname, window.location.search);
  if (current.landingPage) return current;
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object" || !("recordedAt" in stored) ||
      typeof stored.recordedAt !== "number" || !Number.isFinite(stored.recordedAt) ||
      Date.now() - stored.recordedAt > MAX_AGE_MS || stored.recordedAt > Date.now()) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return {};
    }
    const record = stored as Record<string, unknown>;
    if (typeof record.landingPage !== "string" || !publicPath(record.landingPage)) return {};
    const attribution: LeadAttribution = { landingPage: record.landingPage };
    for (const [, field] of UTM_FIELDS) {
      const value = parameter(record[field]);
      if (value) attribution[field] = value;
    }
    return attribution;
  } catch {
    return {};
  }
}
