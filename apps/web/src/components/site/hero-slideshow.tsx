"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Backgrounds rotate independently of the stable heading and calls to action. */
export function HeroSlideshow({ slides }: { slides: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const schedule = () => {
      clearInterval(timer);
      if (document.hidden) return;
      timer = setInterval(() => {
        setActive((current) => {
          const images = root.current?.querySelectorAll<HTMLImageElement>(".hero-slide img");
          for (let offset = 1; offset < slides.length; offset += 1) {
            const next = (current + offset) % slides.length;
            const image = images?.[next];
            if (image?.complete && image.naturalWidth > 0) return next;
          }
          return current;
        });
      }, 4000);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [slides.length, paused, reducedMotion]);

  return (
    <div ref={root} className="hero-slideshow">
      <div className="hero-visual">
        {slides.map((slide, index) => (
          <div key={index} className={`hero-slide ${index === active ? "is-active" : ""}`} aria-hidden={index !== active}>
            {slide}
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="hero-slide-controls">
          <span aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => { setPaused(true); setActive((value) => (value + 1) % slides.length); }} aria-label="Mostrar próxima imagem"><span aria-hidden="true">→</span></button>
          {reducedMotion ? <span className="sr-only">Alternância automática desativada pela preferência de movimento reduzido.</span> : (
            <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Retomar alternância de imagens" : "Pausar alternância de imagens"}>
              <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
              <span>{paused ? "Retomar" : "Pausar"}</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
