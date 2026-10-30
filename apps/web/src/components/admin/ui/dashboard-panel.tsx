"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function DashboardPanel({ title, count, action, children }: {
  title: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    modal.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [open]);

  return (
    <section className="min-w-0 overflow-hidden border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 id={`${id}-heading`} className="text-base font-medium">{title}</h2>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-foreground-muted">{count}</span>
        </div>
        <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Ampliar ${title}`} className="inline-flex min-h-11 items-center gap-2 px-2 text-xs text-brand hover:bg-background">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Ampliar
        </button>
      </div>
      <div role="region" aria-labelledby={`${id}-heading`} tabIndex={0} className="max-h-80 overflow-y-auto overscroll-contain px-5 [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-brand">
        {children}
      </div>
      {action ? <div className="flex justify-end border-t border-border px-5 py-3">{action}</div> : null}
      <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-hidden border border-border bg-surface-elevated p-0 text-foreground shadow-soft backdrop:bg-ink/60 backdrop:backdrop-blur-sm">
        {open ? <div className="flex max-h-[90dvh] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5 sm:p-7">
            <div><p className="text-xs uppercase tracking-widest text-brand">Visão ampliada</p><h2 id={`${id}-title`} className="mt-2 text-2xl">{title}</h2><p id={`${id}-description`} className="mt-2 text-sm text-foreground-muted">{count} {count === 1 ? "registro neste resumo" : "registros neste resumo"}. {action ? "Acesse a lista completa para consultar outros registros." : "Dados do período exibido no painel."}</p></div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Fechar visão ampliada" className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border hover:bg-background"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
          </div>
          <div tabIndex={0} role="region" aria-label={`Registros de ${title}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 [scrollbar-gutter:stable]">{children}</div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-7"><span className="text-xs text-foreground-muted">Pressione Esc para fechar</span>{action}</div>
        </div> : null}
      </dialog>
    </section>
  );
}
