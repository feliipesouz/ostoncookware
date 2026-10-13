"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const selector = "[data-editorial-reveal]";

/** Progressive enhancement: server-rendered content is always visible. */
export function EditorialMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      pathname?.startsWith("/admin") ||
      !window.IntersectionObserver ||
      !Element.prototype.animate
    ) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const registered = new WeakSet<Element>();
    const animations = new Map<Element, Animation>();

    const reveal = (element: Element) => {
      observer.unobserve(element);
      if (preference.matches || element.contains(document.activeElement)) return;
      const delay = Math.min(240, Math.max(0, Number(element.getAttribute("data-editorial-delay")) || 0));
      const animation = element.animate(
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 1000, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
      );
      animations.set(element, animation);
      animation.onfinish = animation.oncancel = () => animations.delete(element);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target);
      }
    }, { rootMargin: "0px 0px -24px 0px", threshold: 0 });

    const register = (element: Element) => {
      if (registered.has(element)) return;
      registered.add(element);
      // Restored scroll positions and reduced-motion visitors should never see a replay.
      if (preference.matches || element.getBoundingClientRect().bottom <= 0) return;
      observer.observe(element);
    };
    const scan = (root: ParentNode) => root.querySelectorAll(selector).forEach(register);
    scan(document);

    // App Router can stream marked sections after the layout has hydrated.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(selector)) register(node);
          scan(node);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let element: Element | null = event.target.closest(selector);
      while (element) {
        observer.unobserve(element);
        animations.get(element)?.cancel();
        element = element.parentElement?.closest(selector) ?? null;
      }
    };
    const onPreference = () => {
      if (!preference.matches) return;
      observer.disconnect();
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    };
    document.addEventListener("focusin", onFocus);
    preference.addEventListener("change", onPreference);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("focusin", onFocus);
      preference.removeEventListener("change", onPreference);
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    };
  }, [pathname]);

  return null;
}
