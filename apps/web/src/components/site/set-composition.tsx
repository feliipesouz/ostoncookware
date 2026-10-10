"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { ArrowUpRightIcon } from "./icons";
import { SiteImage } from "./site-image";

export type CompositionPiece = {
  id: string;
  name: string;
  diameter: string;
  capacity: string;
};

export type SetCompositionProps = {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  pieces: CompositionPiece[];
  accessoriesTitle: string;
  accessories: string[];
  ctaLabel: string;
  ctaHref: string;
};

export function SetComposition({
  eyebrow,
  title,
  body,
  imageUrl,
  imageAlt,
  pieces,
  accessoriesTitle,
  accessories,
  ctaLabel,
  ctaHref,
}: SetCompositionProps) {
  const id = useId();
  const [selectedId, setSelectedId] = useState(pieces[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    pieces.findIndex((piece) => piece.id === selectedId),
  );

  if (pieces.length === 0) return null;

  function selectPiece(index: number) {
    const piece = pieces[index];
    if (!piece) return;
    setSelectedId(piece.id);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % pieces.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + pieces.length) % pieces.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = pieces.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectPiece(nextIndex);
  }

  return (
    <section className="composition-section" aria-labelledby={`${id}-title`}>
      <div className="site-grid">
        <div className="composition-heading editorial-enter">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display-title" id={`${id}-title`}>
              {title}
            </h2>
          </div>
          <p className="editorial-copy">{body}</p>
        </div>

        <div className="composition-layout" data-has-image={Boolean(imageUrl)}>
          {imageUrl ? (
            <div className="composition-visual">
              <SiteImage
                src={imageUrl}
                alt={imageAlt ?? "Conjunto OSTON"}
                fill
                sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) 50vw, 58vw"
                className="composition-photo"
              />
            </div>
          ) : null}

          <div className="composition-inspector">
            <div
              className="composition-tabs"
              role="tablist"
              aria-label="Peças do conjunto"
              aria-orientation="vertical"
            >
              {pieces.map((piece, index) => (
                <button
                  key={piece.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={`${id}-tab-${index}`}
                  className="composition-tab"
                  type="button"
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-controls={`${id}-panel-${index}`}
                  tabIndex={index === selectedIndex ? 0 : -1}
                  onClick={() => setSelectedId(piece.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <span className="composition-tab-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="composition-tab-name">{piece.name}</span>
                  <span className="composition-tab-diameter">{piece.diameter}</span>
                  <ArrowUpRightIcon className="composition-tab-arrow" />
                </button>
              ))}
            </div>

            <div className="composition-panels">
              {pieces.map((piece, index) => (
                <div
                  key={piece.id}
                  id={`${id}-panel-${index}`}
                  className="composition-panel"
                  role="tabpanel"
                  aria-labelledby={`${id}-tab-${index}`}
                  tabIndex={0}
                  hidden={index !== selectedIndex}
                >
                  <h3 className="composition-piece-name">{piece.name}</h3>
                  <dl className="composition-specs">
                    <div className="composition-capacity">
                      <dt>Capacidade</dt>
                      <dd>{piece.capacity}</dd>
                    </div>
                    <div className="composition-diameter">
                      <dt>Diâmetro</dt>
                      <dd>{piece.diameter}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="composition-accessories">
          <h3>{accessoriesTitle}</h3>
          <ul className="composition-accessory-list">
            {accessories.map((accessory, index) => (
              <li key={`${index}-${accessory}`}>{accessory}</li>
            ))}
          </ul>
          <Link href={isSafeCtaUrl(ctaHref) ? ctaHref : "/colecoes"} className="button-link">
            {ctaLabel}
            <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
