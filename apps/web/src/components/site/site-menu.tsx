"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "@/lib/content";
import { CatalogDownload } from "./catalog-download";
import { ArrowUpRightIcon } from "./icons";

function activePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="desktop-navigation" aria-label="Navegação principal">
      {items.map((item) => (
        <Link
          key={item.id ?? item.href}
          href={item.href}
          aria-current={activePath(pathname, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteMenu({
  items,
  catalog,
  brandName,
}: {
  items: NavigationItem[];
  catalog?: string;
  brandName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="menu-trigger"
        aria-label="Abrir menu de navegação"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
      >
        <span />
        <span />
      </button>
      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-labelledby="site-menu-title"
        className="site-menu"
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="site-menu-inner">
          <div className="site-menu-heading">
            <p id="site-menu-title" className="eyebrow">
              {brandName}
            </p>
            <button type="button" className="menu-close" aria-label="Fechar menu" onClick={close}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 5 14 14M5 19 19 5" />
              </svg>
            </button>
          </div>
          <nav aria-label="Menu principal" className="mobile-navigation">
            {items.map((item, index) => (
              <Link
                key={item.id ?? item.href}
                href={item.href}
                onClick={close}
                aria-current={activePath(pathname, item.href) ? "page" : undefined}
              >
                <span className="editorial-number">{String(index + 1).padStart(2, "0")}</span>
                <span>{item.label}</span>
                <ArrowUpRightIcon />
              </Link>
            ))}
          </nav>
          <div className="site-menu-contact">
            <p className="editorial-copy">Uma conversa para encontrar o seu jeito de cozinhar.</p>
            <Link href="/contato" className="button-primary" onClick={close}>
              Falar com a OSTON <ArrowUpRightIcon />
            </Link>
            {catalog ? <CatalogDownload href={catalog} className="button-link" /> : null}
          </div>
          <p className="site-menu-signature">O prazer de estar presente.</p>
        </div>
      </dialog>
    </>
  );
}
