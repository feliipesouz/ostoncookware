"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { adminMutate } from "@/lib/admin-client";

type Asset = {
  id: string;
  url: string;
  originalFilename: string;
  alt: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  size: number;
  type?: string;
  tags?: string[];
  focalX?: number | null;
  focalY?: number | null;
};

type UsageItem = { type: string; id: string; name: string; href: string };

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function sanitizeFilename(value: string) {
  const base = value.replace(/\\/g, "/").split("/").pop() ?? "file";
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 180) || "file";
}

async function readImageSize(file: File) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return { width: null as number | null, height: null as number | null };
  }
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  return { width, height };
}

export function MediaLibrary({ initial }: { initial: Asset[] }) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState("");
  const [missingAlt, setMissingAlt] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageItem[]>([]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function refresh(next = { q, type, tags, missingAlt }) {
    const params = new URLSearchParams({ pageSize: "50" });
    if (next.q) params.set("q", next.q);
    if (next.type) params.set("type", next.type);
    if (next.tags) params.set("tags", next.tags);
    if (next.missingAlt) params.set("missingAlt", "true");
    const refreshed = await fetch(`/v1/admin/media?${params}`, { credentials: "include" });
    const payload = (await refreshed.json()) as { data?: Asset[] };
    setItems(payload.data ?? []);
  }

  async function loadUsage(id: string) {
    const response = await fetch(`/v1/admin/media/${id}/usage`, { credentials: "include" });
    if (!response.ok) {
      setUsage([]);
      return;
    }
    const payload = (await response.json()) as { data?: { items?: UsageItem[] } };
    setUsage(payload.data?.items ?? []);
  }

  async function onFile(file: File) {
    setBusy(true);
    setMessage("Enviando…");
    try {
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        throw new Error("SVG não é permitido.");
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Use JPEG, PNG, WebP ou AVIF.");
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error("A imagem deve ter no máximo 10 MB.");
      }

      const ext = EXT[file.type] ?? "bin";
      const pathname = `oston/media/${crypto.randomUUID()}.${ext}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/v1/admin/media/upload",
        clientPayload: JSON.stringify({
          mimeType: file.type,
          size: file.size,
          type: "IMAGE",
        }),
      });

      const dimensions = await readImageSize(file);
      const completed = await fetch("/v1/admin/media/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: blob.url,
          pathname: blob.pathname.replace(/^\//, ""),
          originalFilename: sanitizeFilename(file.name),
          alt: null,
          mimeType: file.type,
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
          type: "IMAGE",
        }),
      });

      if (completed.status === 503) {
        setMessage("Vercel Blob não está configurado neste ambiente.");
        return;
      }
      if (!completed.ok) {
        const problem = (await completed.json().catch(() => ({}))) as { title?: string };
        throw new Error(problem.title ?? "Falha ao registrar a mídia.");
      }

      setMessage("Imagem enviada.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  async function saveAlt(id: string, alt: string) {
    await adminMutate(`/v1/admin/media/${id}`, "PATCH", { alt: alt || null });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, alt } : item)));
  }

  async function saveTags(id: string, value: string) {
    const next = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    await adminMutate(`/v1/admin/media/${id}`, "PATCH", { tags: next });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, tags: next } : item)));
  }

  async function saveFocal(id: string, focalX: number, focalY: number) {
    await adminMutate(`/v1/admin/media/${id}`, "PATCH", { focalX, focalY });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, focalX, focalY } : item)));
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta mídia? Só é permitido se ela não estiver em uso.")) return;
    try {
      await adminMutate(`/v1/admin/media/${id}`, "DELETE");
      setItems((current) => current.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setUsage([]);
      }
      setMessage("Mídia excluída.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir.");
    }
  }

  return (
    <div>
      <p className="mt-4 text-sm text-foreground-muted">
        Desktop recomendado: 1920×1080 · Mobile: 1080×1350 — orientação, não bloqueia o envio.
      </p>
      <form
        className="mt-6 grid gap-3 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          void refresh();
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar arquivo ou ALT"
          className="border border-border px-3 py-2 text-sm"
        />
        <select value={type} onChange={(event) => setType(event.target.value)} className="border border-border px-3 py-2 text-sm">
          <option value="">Todos os tipos</option>
          <option value="IMAGE">Imagem</option>
          <option value="VIDEO">Vídeo</option>
          <option value="DOCUMENT">Documento</option>
        </select>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags (vírgula)"
          className="border border-border px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={missingAlt} onChange={(event) => setMissingAlt(event.target.checked)} />
          Sem ALT
        </label>
        <button type="submit" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
          Buscar
        </button>
      </form>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-border px-6 py-12 text-sm">
        Arraste ou clique para enviar uma imagem
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) void onFile(file);
          }}
        />
      </label>
      {message ? <p className="mt-3 text-sm text-foreground-muted">{message}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`border bg-surface p-3 text-sm ${selectedId === item.id ? "border-foreground" : "border-border"}`}
            >
              <button
                type="button"
                className="block w-full"
                onClick={() => {
                  setSelectedId(item.id);
                  void loadUsage(item.id);
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" />
                </div>
              </button>
              <p className="mt-3 truncate">{item.originalFilename}</p>
              <p className="text-xs text-foreground-muted">
                {item.width ?? "—"}×{item.height ?? "—"} · {Math.round(item.size / 1024)} KB · {item.mimeType}
              </p>
              <label className="mt-2 grid gap-1 text-xs">
                ALT
                <input
                  defaultValue={item.alt ?? ""}
                  className="border border-border px-2 py-1"
                  onBlur={(event) => {
                    const next = event.target.value;
                    if (next !== (item.alt ?? "")) void saveAlt(item.id, next);
                  }}
                />
              </label>
              <button type="button" className="mt-3 text-xs underline" onClick={() => void remove(item.id)}>
                Excluir
              </button>
            </article>
          ))}
        </div>

        <aside className="border border-border bg-surface p-4 text-sm">
          <h2 className="text-lg">Uso e foco</h2>
          {!selected ? (
            <p className="mt-3 text-foreground-muted">Selecione uma imagem para ver onde ela aparece e ajustar o ponto focal.</p>
          ) : (
            <>
              <p className="mt-3">{selected.originalFilename}</p>
              <button
                type="button"
                className="relative mt-3 block w-full overflow-hidden bg-graphite"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const focalX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                  const focalY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
                  void saveFocal(selected.id, Number(focalX.toFixed(3)), Number(focalY.toFixed(3)));
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.url} alt={selected.alt ?? ""} className="h-auto w-full" />
                {selected.focalX != null && selected.focalY != null ? (
                  <span
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-foreground"
                    style={{ left: `${selected.focalX * 100}%`, top: `${selected.focalY * 100}%` }}
                  />
                ) : null}
              </button>
              <p className="mt-2 text-xs text-foreground-muted">Clique na imagem para definir o ponto focal (0–1).</p>
              <label className="mt-4 grid gap-1 text-xs">
                Tags
                <input
                  defaultValue={(selected.tags ?? []).join(", ")}
                  key={`${selected.id}-tags`}
                  className="border border-border px-2 py-1"
                  onBlur={(event) => void saveTags(selected.id, event.target.value)}
                />
              </label>
              <h3 className="mt-6 text-sm">Em uso</h3>
              {usage.length === 0 ? (
                <p className="mt-2 text-foreground-muted">Esta imagem ainda não está vinculada.</p>
              ) : (
                <ul className="mt-2 grid gap-1">
                  {usage.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <a className="underline" href={item.href}>
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-foreground-muted">
                Para substituir um arquivo, veja o uso e troque as referências. Não há replace in-place do blob.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
