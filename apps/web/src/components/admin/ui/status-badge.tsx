const TONES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-foreground/10 text-foreground" },
  SCHEDULED: { label: "Agendada", className: "bg-warning/15 text-warning" },
  PUBLISHED: { label: "Publicado", className: "bg-success/15 text-success" },
  ARCHIVED: { label: "Arquivado", className: "bg-foreground-muted/15 text-foreground-muted" },
  NEW: { label: "Novo", className: "bg-brand/15 text-brand" },
  CONTACTED: { label: "Contatado", className: "bg-foreground/10 text-foreground" },
  QUALIFIED: { label: "Qualificado", className: "bg-success/15 text-success" },
  WON: { label: "Ganho", className: "bg-success/20 text-success" },
  LOST: { label: "Perdido", className: "bg-danger/15 text-danger" },
  AVAILABLE: { label: "Disponível", className: "bg-success/15 text-success" },
  UNAVAILABLE: { label: "Indisponível", className: "bg-danger/15 text-danger" },
  COMING_SOON: { label: "Em breve", className: "bg-warning/15 text-warning" },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? { label: status, className: "bg-foreground/10 text-foreground-muted" };
  return (
    <span className={`inline-flex px-2 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase ${tone.className}`}>
      {tone.label}
    </span>
  );
}
