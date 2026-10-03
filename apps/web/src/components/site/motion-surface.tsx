"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Decorative pointer depth. All content remains visible without JavaScript. */
export function MotionSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    const preference = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    );
    if (!surface) return;
    let frame = 0;

    function move(event: PointerEvent) {
      if (!preference.matches || !surface) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = surface.getBoundingClientRect();
        surface.style.setProperty(
          "--pointer-x",
          `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}px`,
        );
        surface.style.setProperty(
          "--pointer-y",
          `${((event.clientY - bounds.top) / bounds.height - 0.5) * 10}px`,
        );
      });
    }

    function reset() {
      cancelAnimationFrame(frame);
      surface?.style.setProperty("--pointer-x", "0px");
      surface?.style.setProperty("--pointer-y", "0px");
    }

    surface.addEventListener("pointermove", move, { passive: true });
    surface.addEventListener("pointerleave", reset);
    preference.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      preference.removeEventListener("change", reset);
    };
  }, []);

  return (
    <div ref={surfaceRef} className={`motion-surface ${className}`}>
      {children}
    </div>
  );
}
