"use client";

import { useEffect } from "react";

const MESSAGE = "Você tem alterações não salvas. Se sair agora, elas serão perdidas.";

export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = MESSAGE;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDirty]);
}

export function useSaveHotkey(isDirty: boolean, onSave: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      if (!isDirty) return;
      event.preventDefault();
      onSave();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDirty, onSave]);
}
