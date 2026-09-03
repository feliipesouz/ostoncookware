"use client";

import { useEffect, useState } from "react";
import { useFocusTrap } from "./ui/use-focus-trap";
import { fieldClass } from "./ui/form-section";

export type PickedMedia = {
  id: string;
  url: string;
  alt: string | null;
  originalFilename?: string;
  width?: number | null;
  height?: number | null;
};

export function MediaPicker({
  open,
  multiple = true,
  selectedIds,
  onClose,
  onSelect,
}: {
  open: boolean;
  multiple?: boolean;
  selectedIds: string[];
  onClose: () => void;
  onSelect: (items: PickedMedia[]) => void;
}) {
  if (!open) return null;
  return (
    <MediaPickerDialog multiple={multiple} selectedIds={selectedIds} onClose={onClose} onSelect={onSelect} />
  );
}

function MediaPickerDialog({
  multiple,
  selectedIds,
  onClose,
  onSelect,
}: {
  multiple: boolean;
  selectedIds: string[];
  onClose: () => void;
  onSelect: (items: PickedMedia[]) => void;
}) {
  const trapRef = useFocusTrap(true, onClose);
  const [items, setItems] = useState<PickedMedia[]>([]);
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void fetch(`/v1/admin/media?pageSize=50${q ? `&q=${encodeURIComponent(q)}` : ""}`, {
        credentials: "include",
      })
        .then((response) => response.json() as Promise<{ data?: PickedMedia[] }>)
        .then((payload) => {
          if (!cancelled) setItems(payload.data ?? []);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [q]);

  function toggle(id: string) {
    if (multiple) {
      setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    } else {
      setPicked([id]);
    }
  }

  function confirm() {
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered = picked.map((id) => byId.get(id)).filter((item): item is PickedMedia => Boolean(item));
    onSelect(ordered.length > 0 ? ordered : items.filter((item) => picked.includes(item.id)));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col border border-border bg-surface-elevated"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="media-picker-title" className="text-lg">
            Biblioteca de mídia
          </h2>
          <button type="button" onClick={onClose} className="text-sm underline">
            Fechar
          </button>
        </div>
        <div className="border-b border-border px-4 py-3">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por arquivo ou ALT…"
            className={fieldClass}
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
          {items.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-foreground-muted">
              Nenhuma imagem encontrada. Envie arquivos em Mídia e volte aqui.
            </p>
          ) : (
            items.map((item) => {
              const active = picked.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`border p-2 text-left text-xs ${active ? "border-foreground" : "border-border"}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-graphite">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-2 truncate">{item.originalFilename ?? item.id}</p>
                  {!item.alt ? <p className="text-warning">Sem ALT</p> : null}
                </button>
              );
            })
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button type="button" className="border border-border px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse" onClick={confirm}>
            Usar selecionadas
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaStrip({
  items,
  onRemove,
  onReorder,
  onAdd,
  addLabel = "Adicionar imagens",
}: {
  items: PickedMedia[];
  onRemove: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
  onAdd: () => void;
  addLabel?: string;
}) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <article key={item.id} className="border border-border p-2 text-xs">
            <div className="aspect-[4/3] overflow-hidden bg-graphite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" />
            </div>
            <p className="mt-2 truncate">{item.originalFilename ?? item.id}</p>
            {!item.alt ? <p className="text-warning">Falta texto ALT</p> : null}
            <div className="mt-2 flex gap-2">
              {onReorder ? (
                <>
                  <button type="button" className="underline" disabled={index === 0} onClick={() => onReorder(index, index - 1)}>
                    Subir
                  </button>
                  <button
                    type="button"
                    className="underline"
                    disabled={index === items.length - 1}
                    onClick={() => onReorder(index, index + 1)}
                  >
                    Descer
                  </button>
                </>
              ) : null}
              <button type="button" className="underline text-danger" onClick={() => onRemove(item.id)}>
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>
      <button type="button" className="mt-3 border border-border px-4 py-2 text-sm" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}
