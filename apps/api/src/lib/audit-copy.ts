type AuditCopyInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  metadata?: Record<string, unknown> | null;
};

const ENTITY_LABEL: Record<string, string> = {
  lead: "Lead",
  product: "Produto",
  collection: "Coleção",
  campaign: "Campanha",
  media: "Mídia",
  settings: "Configurações",
  user: "Usuário",
  page: "Página",
};

function labelEntity(entity: string) {
  return ENTITY_LABEL[entity] ?? entity;
}

function named(metadata: Record<string, unknown> | null | undefined) {
  const name = metadata?.name ?? metadata?.title ?? metadata?.slug ?? metadata?.originalFilename;
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
}

function actor(input: AuditCopyInput) {
  const fromName = input.actorName?.trim();
  if (fromName) {
    return fromName.split(/\s+/)[0] ?? fromName;
  }
  const email = input.actorEmail?.trim();
  if (email) {
    return email.split("@")[0] ?? email;
  }
  return "Alguém";
}

function subject(input: AuditCopyInput) {
  return named(input.metadata) ?? (input.entityId ? `${labelEntity(input.entity)} ${input.entityId}` : labelEntity(input.entity));
}

export function humanAuditMessage(input: AuditCopyInput): string {
  const who = actor(input);
  const what = subject(input);
  const entity = labelEntity(input.entity);
  const meta = input.metadata ?? {};

  switch (input.action) {
    case "CREATE":
      return `${who} criou ${entity} ${named(meta) ?? what}`.replace(`${entity} ${entity}`, entity);
    case "UPDATE":
      return `${who} atualizou ${what}`;
    case "PUBLISH":
      return `${who} publicou ${what}`;
    case "UNPUBLISH":
      return `${who} despublicou ${what}`;
    case "ARCHIVE":
      return `${who} arquivou ${what}`;
    case "DELETE":
      return `${who} excluiu ${what}`;
    case "UPLOAD":
      return `${who} enviou ${named(meta) ?? "um arquivo"}`;
    case "STATUS_CHANGE": {
      const from = typeof meta.from === "string" ? meta.from : null;
      const to = typeof meta.to === "string" ? meta.to : typeof meta.status === "string" ? meta.status : null;
      if (from && to) {
        return `${who} alterou ${what} de ${from} para ${to}`;
      }
      if (to) {
        return `${who} alterou o status de ${what} para ${to}`;
      }
      return `${who} alterou o status de ${what}`;
    }
    case "EXPORT":
      return `${who} exportou ${entity.toLowerCase()}`;
    case "IMPORT":
      return `${who} importou ${entity.toLowerCase()}`;
    case "RESTORE":
      return `${who} restaurou ${what}`;
    case "ROLE_CHANGE": {
      const to = typeof meta.role === "string" ? meta.role : typeof meta.to === "string" ? meta.to : null;
      return to ? `${who} alterou o papel de ${what} para ${to}` : `${who} alterou o papel de ${what}`;
    }
    case "LOGIN":
      return `${who} entrou no CMS`;
    case "LOGOUT":
      return `${who} saiu do CMS`;
    default:
      return `${who} executou ${input.action.toLowerCase()} em ${what}`;
  }
}
