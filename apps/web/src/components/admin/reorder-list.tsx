"use client";

export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) {
    return items;
  }
  const copy = [...items];
  const [removed] = copy.splice(index, 1);
  copy.splice(next, 0, removed as T);
  return copy;
}

export function ReorderControls({
  index,
  total,
  onMove,
  label,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  label: string;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        aria-label={`Subir ${label}`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className="border border-border px-2 py-1 text-xs disabled:opacity-40"
      >
        Subir
      </button>
      <button
        type="button"
        aria-label={`Descer ${label}`}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        className="border border-border px-2 py-1 text-xs disabled:opacity-40"
      >
        Descer
      </button>
    </div>
  );
}
