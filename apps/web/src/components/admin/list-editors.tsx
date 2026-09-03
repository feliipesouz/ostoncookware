"use client";

import { fieldClass } from "./ui/form-section";

export function StringListEditor({
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  function update(index: number, value: string) {
    onChange(items.map((item, i) => (i === index ? value : item)));
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const item = next.splice(from, 1)[0];
    if (item === undefined) return;
    next.splice(to, 0, item);
    onChange(next);
  }
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input className={fieldClass} value={item} placeholder={placeholder} onChange={(e) => update(index, e.target.value)} />
          <button type="button" className="text-xs underline" onClick={() => move(index, index - 1)}>
            Subir
          </button>
          <button type="button" className="text-xs underline" onClick={() => move(index, index + 1)}>
            Descer
          </button>
          <button type="button" className="text-xs underline text-danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className="justify-self-start border border-border px-3 py-1.5 text-sm" onClick={() => onChange([...items, ""])}>
        {addLabel}
      </button>
    </div>
  );
}

export function NamedValueListEditor({
  items,
  onChange,
}: {
  items: { label: string; value: string }[];
  onChange: (items: { label: string; value: string }[]) => void;
}) {
  function update(index: number, patch: Partial<{ label: string; value: string }>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const item = next.splice(from, 1)[0];
    if (item === undefined) return;
    next.splice(to, 0, item);
    onChange(next);
  }
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className={fieldClass}
            placeholder="Rótulo, ex. Diâmetro"
            value={item.label}
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <input
            className={fieldClass}
            placeholder="Valor, ex. 28 cm"
            value={item.value}
            onChange={(e) => update(index, { value: e.target.value })}
          />
          <div className="flex items-center gap-2 text-xs">
            <button type="button" className="underline" onClick={() => move(index, index - 1)}>
              Subir
            </button>
            <button type="button" className="underline" onClick={() => move(index, index + 1)}>
              Descer
            </button>
            <button
              type="button"
              className="underline text-danger"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remover
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="justify-self-start border border-border px-3 py-1.5 text-sm"
        onClick={() => onChange([...items, { label: "", value: "" }])}
      >
        Adicionar especificação
      </button>
    </div>
  );
}
