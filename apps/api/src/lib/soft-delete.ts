import { HttpError } from "./errors.js";

export function notDeleted() {
  return { deletedAt: null };
}

export function wantsTrash(query: unknown) {
  if (!query || typeof query !== "object") {
    return false;
  }
  const value = (query as { trash?: unknown }).trash;
  return value === true || value === 1 || value === "1" || value === "true";
}

export function trashWhere(query: unknown) {
  return wantsTrash(query) ? { deletedAt: { not: null } } : { deletedAt: null };
}

export function softDeleteData() {
  return {
    deletedAt: new Date(),
    status: "ARCHIVED" as const,
    featured: false,
  };
}

export function restoreFromTrashData() {
  return { deletedAt: null };
}

export function assertNotInTrash<T extends { deletedAt?: Date | null }>(
  row: T | null,
  message = "Registro não encontrado.",
): T {
  if (!row || row.deletedAt) {
    throw new HttpError(404, message, { code: "NOT_FOUND" });
  }
  return row;
}

export function assertInTrash<T extends { deletedAt?: Date | null }>(row: T) {
  if (!row.deletedAt) {
    throw new HttpError(409, "Só é possível excluir definitivamente itens que já estão na lixeira.", {
      code: "NOT_IN_TRASH",
    });
  }
}

export function collectionInUseError(products: { name: string }[]) {
  const names = products.map((product) => product.name);
  const listed = names.join(", ");
  throw new HttpError(409, `Não é possível excluir a coleção. Ela ainda possui produtos: ${listed}.`, {
    code: "IN_USE",
    detail: listed,
    meta: { products: names },
  });
}
