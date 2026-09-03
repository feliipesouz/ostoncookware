"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("disabled"));
    items()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const list = items();
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, onClose]);

  return ref;
}
