import { HttpError } from "./errors.js";

export type ContentActor = {
  id: string;
  name: string;
};

export type VersionedRecord = {
  version: number;
  deletedAt?: Date | null;
  updatedAt?: Date | null;
  updatedBy?: { name: string } | null;
};

export function updateWhereVersion(id: string, expectedVersion: number) {
  return { id, version: expectedVersion, deletedAt: null };
}

export function requireExpectedVersion(expectedVersion: number | undefined) {
  if (expectedVersion === undefined) {
    throw new HttpError(400, "Informe expectedVersion para atualizar este conteúdo.", {
      code: "VALIDATION_ERROR",
      detail: "A edição exige a versão lida do conteúdo para evitar sobrescrita.",
    });
  }
  return expectedVersion;
}

export function versionConflictError(current: VersionedRecord) {
  const editor = current.updatedBy?.name;
  const when = current.updatedAt
    ? current.updatedAt.toLocaleString("pt-BR")
    : null;
  const detail = editor
    ? `Última alteração por ${editor}${when ? ` em ${when}` : ""}.`
    : when
      ? `Última alteração em ${when}.`
      : "Recarregue a página e tente novamente.";

  return new HttpError(409, "Este conteúdo foi alterado por outra pessoa enquanto você editava.", {
    code: "VERSION_CONFLICT",
    detail,
    meta: {
      currentVersion: current.version,
      updatedAt: current.updatedAt?.toISOString() ?? null,
      updatedBy: editor ?? null,
    },
  });
}

export function applyVersionedUpdate<T extends VersionedRecord>(
  current: T | null,
  expectedVersion: number,
): T {
  if (!current || current.deletedAt) {
    throw new HttpError(404, "Registro não encontrado.", { code: "NOT_FOUND" });
  }
  if (current.version !== expectedVersion) {
    throw versionConflictError(current);
  }
  return { ...current, version: current.version + 1 };
}

export function throwIfVersionConflict(current: VersionedRecord | null, updatedCount: number) {
  if (updatedCount > 0) {
    return;
  }
  if (!current || current.deletedAt) {
    throw new HttpError(404, "Registro não encontrado.", { code: "NOT_FOUND" });
  }
  throw versionConflictError(current);
}
