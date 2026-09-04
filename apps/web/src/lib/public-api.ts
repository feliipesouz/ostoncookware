import "server-only";

import { unstable_cache } from "next/cache";
import { ApiError } from "@/lib/api";
import { dispatchApi } from "@/lib/dispatch-api";

export async function publicGet<T>(path: string, tags: string[]): Promise<T> {
  return unstable_cache(
    async () => {
      const response = await dispatchApi(path, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new ApiError(`Falha ao carregar ${path}`, response.status);
      }

      return (await response.json()) as T;
    },
    ["public-get", path],
    { tags, revalidate: 60 },
  )();
}
