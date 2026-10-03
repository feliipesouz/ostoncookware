"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Collection, Product } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { availabilityLabel, formatCatalogPrice, normalizeCatalogSearch } from "@/lib/catalog";
import { SiteImage } from "./site-image";

export function CollectionExplorer({ collections }: { collections: Collection[] }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = collections.filter((collection) => selectedIds.includes(collection.id));
  const needle = normalizeCatalogSearch(query);
  const visible = collections.filter((collection) =>
    normalizeCatalogSearch([collection.name, collection.shortDescription, collection.description].join(" ")).includes(needle),
  );

  function toggleComparison(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }

  return (
    <section aria-label="Explorar coleções">
      <div className="mb-10 flex flex-col gap-5 border-y border-border py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-foreground-muted" aria-live="polite">
            {visible.length} {visible.length === 1 ? "coleção para explorar" : "coleções para explorar"}
          </p>
          {selected.length > 0 ? <a href="#compare-heading" className="button-link mt-2">Ver comparação ({selected.length}) <span aria-hidden="true">↓</span></a> : null}
        </div>
        <SearchField id="collection-search" label="Buscar uma coleção" value={query} onChange={setQuery} placeholder="Busque pelo nome ou estilo" />
      </div>
      {visible.length ? (
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((collection, index) => {
            const price = collection.isDemo ? null : formatCatalogPrice(collection.priceFrom);
            return (
              <article key={collection.id}>
              <Link href={"/colecoes/" + collection.slug} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                  {collection.coverImage ? (
                    <SiteImage
                      src={mediaSrc(collection.coverImage.url)}
                      alt={collection.coverImage.alt || collection.name}
                      fill
                      loading={index === 0 ? "eager" : "lazy"}
                      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.035]"
                    />
                  ) : <ImagePlaceholder />}
                  <span className="absolute top-4 left-4 bg-background/95 px-3 py-2 text-[0.65rem] tracking-[0.18em]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {collection.isDemo ? <DemoBadge /> : null}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <h2 className="font-display text-4xl">{collection.name}</h2>
                  <span aria-hidden="true" className="pt-1 text-2xl text-brand transition-transform motion-safe:group-hover:translate-x-1">↗</span>
                </div>
                {collection.shortDescription ? <p className="mt-3 text-sm leading-7 text-foreground-muted">{collection.shortDescription}</p> : null}
                <p className="mt-5 text-[0.65rem] tracking-[0.22em] uppercase">
                  {price ? "A partir de " + price : "Explorar coleção"}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => toggleComparison(collection.id)}
                aria-pressed={selectedIds.includes(collection.id)}
                aria-label={"Comparar " + collection.name}
                disabled={!selectedIds.includes(collection.id) && selectedIds.length >= 3}
                className="mt-5 flex min-h-11 items-center gap-3 text-xs disabled:opacity-40"
              >
                <span aria-hidden="true" className={"flex h-5 w-5 items-center justify-center border " + (selectedIds.includes(collection.id) ? "border-brand bg-brand text-brand-foreground" : "border-border-strong")}>{selectedIds.includes(collection.id) ? "✓" : "+"}</span>
                {selectedIds.includes(collection.id) ? "Na sua comparação" : "Comparar esta cor"}
              </button>
              </article>
            );
          })}
        </div>
      ) : <EmptyResults onReset={() => setQuery("")} />}
      {selected.length > 0 ? (
        <section className="mt-12 border border-border bg-surface p-5 md:p-8" aria-labelledby="compare-heading">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="eyebrow">Sua seleção</p>
              <h2 id="compare-heading" tabIndex={-1} className="font-display mt-3 scroll-mt-8 text-3xl md:text-4xl">Lado a lado, do seu jeito.</h2>
              <p className="mt-3 text-xs leading-7 text-foreground-muted" aria-live="polite">
                {selected.length} de 3 coleções selecionadas. {selected.length < 2 ? "Selecione mais uma para comparar." : "Compare a apresentação e consulte os detalhes de cada conjunto."}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedIds([])} className="min-h-11 text-xs underline underline-offset-4">Limpar seleção</button>
          </div>
          <div className="mt-7 overflow-x-auto pb-3" role="region" aria-label="Comparação visual das coleções selecionadas" tabIndex={0}>
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
              <caption className="sr-only">Comparação das coleções selecionadas. As informações são as publicadas no catálogo.</caption>
              <thead><tr>{selected.map((collection) => <th key={collection.id} scope="col" className="px-3 pb-4 font-display text-2xl font-normal">{collection.name}</th>)}</tr></thead>
              <tbody>
                <tr>{selected.map((collection) => <td key={collection.id} className="px-3 align-top"><div className="relative aspect-square bg-background">{collection.coverImage ? <SiteImage src={mediaSrc(collection.coverImage.url)} alt={collection.coverImage.alt || collection.name} fill sizes="(max-width: 767px) 280px, 33vw" className="object-contain" /> : <ImagePlaceholder />}</div></td>)}</tr>
                <tr>{selected.map((collection) => <td key={collection.id} className="px-3 pt-5 align-top text-sm leading-7 text-foreground-muted">{collection.shortDescription || "Conheça os detalhes desta coleção."}</td>)}</tr>
                <tr>{selected.map((collection) => <td key={collection.id} className="px-3 pt-5 align-top"><Link href={"/colecoes/" + collection.slug} className="button-link">Conhecer {collection.name} <span aria-hidden="true">↗</span></Link><button type="button" onClick={() => toggleComparison(collection.id)} aria-label={"Remover " + collection.name + " da comparação"} className="mt-3 block min-h-11 text-xs text-foreground-muted underline underline-offset-4">Remover</button></td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}

export function ProductExplorer({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [material, setMaterial] = useState("");
  const compatibilities = useMemo(
    () => [...new Set(products.flatMap((product) => product.details?.compatibilities ?? []))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [products],
  );
  const materials = useMemo(
    () => [...new Set(products.flatMap((product) => product.details?.materials ?? []))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [products],
  );
  const needle = normalizeCatalogSearch(query);
  const visible = products.filter((product) => {
    const text = [product.name, product.shortDescription, ...product.features, ...product.itemsIncluded,
      ...product.specifications.flatMap((spec) => [spec.label, spec.value]),
      ...(product.details?.materials ?? []), ...(product.details?.compatibilities ?? [])].join(" ");
    return normalizeCatalogSearch(text).includes(needle)
      && (!compatibility || product.details?.compatibilities.includes(compatibility))
      && (!material || product.details?.materials.includes(material));
  });
  const filtered = Boolean(query || compatibility || material);

  function clearFilters() {
    setQuery("");
    setCompatibility("");
    setMaterial("");
  }

  return (
    <section id="produtos" aria-labelledby="products-heading" className="scroll-mt-28">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">A coleção em detalhe</p>
          <h2 id="products-heading" className="font-display mt-3 text-4xl md:text-5xl">Encontre a sua escolha.</h2>
        </div>
        <p className="text-sm text-foreground-muted" aria-live="polite">
          {visible.length} {visible.length === 1 ? "produto" : "produtos"}
        </p>
      </div>
      <div className="mb-8 flex flex-wrap items-end gap-4 border-y border-border py-5">
        <SearchField id="product-search" label="Buscar nesta coleção" value={query} onChange={setQuery} placeholder="Nome, material ou característica" />
        {compatibilities.length > 0 ? (
          <FilterSelect label="Compatibilidade" value={compatibility} values={compatibilities} onChange={setCompatibility} />
        ) : null}
        {materials.length > 1 ? (
          <FilterSelect label="Material" value={material} values={materials} onChange={setMaterial} />
        ) : null}
        {filtered ? <button type="button" onClick={clearFilters} className="min-h-11 text-sm underline underline-offset-4">Limpar filtros</button> : null}
      </div>
      {visible.length ? (
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : <EmptyResults onReset={clearFilters} />}
    </section>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const price = product.isDemo ? null : formatCatalogPrice(product.price);
  const detail = product.details?.materials[0] || product.specifications[0]?.value;
  return (
    <Link href={"/produtos/" + product.slug} className="group block">
      <div className="relative aspect-square overflow-hidden bg-surface">
        {product.coverImage ? (
          <SiteImage
            src={mediaSrc(product.coverImage.url)}
            alt={product.coverImage.alt || product.name}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
          />
        ) : <ImagePlaceholder />}
        {product.isDemo ? <DemoBadge /> : null}
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <h3 className="font-display text-3xl">{product.name}</h3>
        <span aria-hidden="true" className="text-2xl text-brand">↗</span>
      </div>
      {product.shortDescription ? <p className="mt-3 text-sm leading-7 text-foreground-muted">{product.shortDescription}</p> : null}
      {detail && !product.isDemo ? <p className="mt-3 text-xs text-foreground-muted">{detail}</p> : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm">{price ?? (product.isDemo ? "Conteúdo demonstrativo" : "Sob consulta")}</p>
        <span className="text-[0.65rem] tracking-[0.16em] uppercase">Ver detalhes</span>
      </div>
      {!product.isDemo && product.availability !== "AVAILABLE" ? (
        <p className="mt-2 text-xs text-foreground-muted">{availabilityLabel(product.availability)}</p>
      ) : null}
    </Link>
  );
}

function SearchField({ id, label, value, onChange, placeholder }: {
  id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string;
}) {
  return (
    <label htmlFor={id} className="grid w-full gap-2 text-xs sm:max-w-sm">
      <span>{label}</span>
      <input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} maxLength={120}
        placeholder={placeholder} className="min-h-12 w-full border border-border-strong bg-surface px-4 text-sm" />
    </label>
  );
}

function FilterSelect({ label, value, values, onChange }: {
  label: string; value: string; values: string[]; onChange: (value: string) => void;
}) {
  return (
    <label className="grid flex-1 gap-2 text-xs sm:max-w-56">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 border border-border-strong bg-surface px-3 text-sm">
        <option value="">Todas as opções</option>
        {values.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="border border-border py-16 text-center">
      <p className="font-display text-3xl">Vamos ampliar a busca?</p>
      <p className="mx-auto mt-3 max-w-sm px-4 text-sm leading-7 text-foreground-muted">Nenhum resultado para esses critérios. Tente outro termo ou explore todas as opções.</p>
      <button type="button" onClick={onReset} className="button-secondary mt-6">Mostrar tudo</button>
    </div>
  );
}

function ImagePlaceholder() {
  return <div className="flex h-full items-center justify-center p-8 text-sm text-foreground-muted">Imagem em preparação</div>;
}

function DemoBadge() {
  return <span className="absolute right-4 bottom-4 bg-background/95 px-3 py-2 text-[0.6rem] tracking-[0.16em] uppercase">Demonstração</span>;
}
