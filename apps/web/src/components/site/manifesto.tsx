import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowIcon } from "./icons";

function PresenceMark() {
  return (
    <svg className="manifesto-symbol" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth=".7" />
      <ellipse cx="50" cy="50" rx="22" ry="42" stroke="currentColor" strokeWidth=".7" />
      <ellipse cx="50" cy="50" rx="42" ry="22" stroke="currentColor" strokeWidth=".7" />
      <path d="M8 50h84M50 8v84" stroke="currentColor" strokeWidth=".7" />
    </svg>
  );
}

export function Manifesto({
  eyebrow,
  headline,
  body,
}: {
  eyebrow: string;
  headline: string;
  body: string;
}) {
  return (
    <section className="brand-manifesto">
      <div className="site-grid manifesto-layout">
        <div className="manifesto-marker">
          <p className="eyebrow">{eyebrow}</p>
          <PresenceMark />
        </div>
        <div className="editorial-enter">
          <h2 className="manifesto-statement">{headline}</h2>
          <div className="manifesto-body">
            <p className="editorial-copy">{body}</p>
            <Link href="/a-marca" className="button-link">
              Nosso universo
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Differentials({
  title,
  items,
}: {
  title: string;
  items: { title: string; text: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="differentials-section">
      <div className="site-grid">
        <div className="differentials-heading">
          <p className="eyebrow">A experiência OSTON</p>
          <h2>{title}</h2>
        </div>
        <div
          className="differentials-grid"
          style={{ "--differentials-count": Math.min(items.length, 4) } as CSSProperties}
        >
          {items.map((item, index) => (
            <article key={item.title} className="differential-item editorial-enter">
              <span className="editorial-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
