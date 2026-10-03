"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Media } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { SiteImage } from "./site-image";

export function ProductGallery({ images, name, demo = false }: { images: Media[]; name: string; demo?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const viewerId = useId();
  const current = images[selected];

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center bg-surface p-8 text-center text-foreground-muted">
        As imagens deste produto estão em preparação.
      </div>
    );
  }

  return (
    <section aria-label={"Galeria de " + name}>
      <div className="relative aspect-[5/6] overflow-hidden bg-surface">
        <SiteImage
          src={mediaSrc(current.url)}
          alt={current.alt || name}
          fill
          preload={selected === 0}
          sizes="(max-width: 767px) 100vw, 55vw"
          className="object-contain"
        />
        {demo ? <span className="absolute top-5 left-5 bg-background/95 px-3 py-2 text-[0.65rem] tracking-[0.18em] uppercase">Imagem demonstrativa</span> : null}
        <button
          type="button"
          onClick={() => { dialog.current?.showModal(); setIsOpen(true); }}
          aria-label={"Ampliar imagem de " + name}
          aria-haspopup="dialog"
          className="absolute right-5 bottom-5 flex min-h-12 items-center gap-3 bg-background/95 px-5 text-xs"
        >
          <span aria-hidden="true" className="text-xl">+</span> Ampliar imagem
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-foreground-muted" aria-live="polite">
          {String(selected + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </p>
        {images.length > 1 ? (
          <div className="flex gap-1">
            <button type="button" aria-label="Imagem anterior" onClick={() => setSelected((selected + images.length - 1) % images.length)}
              className="min-h-11 min-w-11 border border-border"><span aria-hidden="true">←</span></button>
            <button type="button" aria-label="Próxima imagem" onClick={() => setSelected((selected + 1) % images.length)}
              className="min-h-11 min-w-11 border border-border"><span aria-hidden="true">→</span></button>
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2" aria-label="Escolher imagem">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={"Ver imagem " + (index + 1) + " de " + name}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={"relative h-20 w-20 shrink-0 border-2 bg-surface transition-colors " + (selected === index ? "border-brand" : "border-transparent hover:border-border-strong")}
            >
              <SiteImage src={mediaSrc(image.url)} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      ) : null}
      <dialog
        ref={dialog}
        aria-labelledby={viewerId}
        className="fixed inset-0 m-auto max-h-[92dvh] w-[min(94vw,72rem)] max-w-none overflow-auto border border-border bg-background p-4 text-foreground backdrop:bg-ink/85 md:p-6"
        onClose={() => setIsOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      >
        <div className="mb-4 flex items-center justify-between gap-5">
          <h2 id={viewerId} className="text-sm">{name}</h2>
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 border border-border px-4 text-xs">Fechar imagem</button>
        </div>
        <div className="relative h-[min(72dvh,48rem)]">
          <SiteImage src={mediaSrc(current.url)} alt={current.alt || name} fill sizes="90vw" className="object-contain" />
        </div>
      </dialog>
    </section>
  );
}
