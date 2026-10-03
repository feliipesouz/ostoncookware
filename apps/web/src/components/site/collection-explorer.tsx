"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { Collection } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { SiteImage } from "./site-image";
import { ArrowIcon, ArrowUpRightIcon } from "./icons";

const collectionTones: Record<string, string> = {
  rose: "#b17e70",
  creme: "#e4ddc9",
  cappuccino: "#a48973",
  "black-piano": "#343634",
  terracota: "#b66c42",
  eucalipto: "#78846f",
};

export function CollectionExplorer({ collections }: { collections: Collection[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = collections[selectedIndex] ?? collections[0];
  if (!selected) return null;

  return (
    <>
      <div className="collection-explorer">
        <div className="explorer-visual">
          {selected.coverImage ? (
            <SiteImage
              key={selected.coverImage.id}
              src={mediaSrc(selected.coverImage.url)}
              alt={selected.coverImage.alt ?? `Conjunto OSTON ${selected.name}`}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className="explorer-photo"
            />
          ) : (
            <div className="explorer-no-image">
              <span>{selected.name}</span>
            </div>
          )}
          {selected.isDemo ? <span className="collection-demo">Demonstração</span> : null}
          <div className="explorer-pagination">
            <span>
              {String(selectedIndex + 1).padStart(2, "0")}
              <span> / {String(collections.length).padStart(2, "0")}</span>
            </span>
            <button
              type="button"
              aria-label="Ver próxima coleção"
              onClick={() => setSelectedIndex((index) => (index + 1) % collections.length)}
            >
              <ArrowIcon />
            </button>
          </div>
        </div>
        <div className="explorer-content">
          <p className="eyebrow">Uma escolha pessoal</p>
          <h3 className="explorer-title">{selected.name}</h3>
          {selected.shortDescription ? (
            <p className="editorial-copy explorer-description">{selected.shortDescription}</p>
          ) : null}
          <fieldset className="explorer-tones">
            <legend>Encontre seu tom</legend>
            <div className="tone-options">
              {collections.map((collection, index) => (
                <button
                  key={collection.id}
                  type="button"
                  aria-pressed={selected.id === collection.id}
                  onClick={() => setSelectedIndex(index)}
                  className="tone-option"
                  style={
                    {
                      "--tone-color": collectionTones[collection.slug] ?? "var(--surface-muted)",
                    } as CSSProperties
                  }
                >
                  <span className="tone-swatch" aria-hidden="true" />
                  <span>{collection.name.replace(/^Coleção\s+/i, "")}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="sr-only" role="status">
            Coleção selecionada: {selected.name}
          </p>
          <Link className="button-primary" href={`/colecoes/${selected.slug}`}>
            Explorar {selected.name.replace(/^Coleção\s+/i, "")}
            <ArrowUpRightIcon />
          </Link>
          <Link className="button-link explorer-compare" href="/colecoes">
            Compare as coleções
            <ArrowIcon />
          </Link>
          <p className="explorer-footnote">Um novo olhar para os seus momentos à mesa.</p>
        </div>
      </div>
      <nav className="collection-index" aria-label="Todas as coleções">
        {collections.map((collection, index) => (
          <Link key={collection.id} href={`/colecoes/${collection.slug}`}>
            <span className="editorial-number">{String(index + 1).padStart(2, "0")}</span>
            {collection.name.replace(/^Coleção\s+/i, "")}
            <ArrowUpRightIcon />
          </Link>
        ))}
      </nav>
    </>
  );
}
