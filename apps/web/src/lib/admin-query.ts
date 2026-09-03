export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function toQueryString(query: Record<string, string | number | boolean | undefined | null>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function searchParamsRecord(searchParams: Record<string, string | string[] | undefined>) {
  return {
    q: firstParam(searchParams.q) ?? "",
    page: firstParam(searchParams.page) ?? "1",
    status: firstParam(searchParams.status) ?? "",
    sort: firstParam(searchParams.sort) ?? "",
    order: firstParam(searchParams.order) === "asc" ? "asc" : firstParam(searchParams.order) === "desc" ? "desc" : "",
    collectionId: firstParam(searchParams.collectionId) ?? "",
    featured: firstParam(searchParams.featured) ?? "",
    interest: firstParam(searchParams.interest) ?? "",
    source: firstParam(searchParams.source) ?? "",
  };
}
