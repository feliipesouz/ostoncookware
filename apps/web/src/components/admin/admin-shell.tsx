"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";

export type NavItem = { href: string; label: string; ownerOnly?: boolean; roles?: string[] };
export type NavGroup = { label: string; items: NavItem[] };

export function AdminShell({
  user,
  isProduction,
  environmentLabel,
  navGroups,
  logoutAction,
  children,
}: {
  user: { name: string; email: string; role: string };
  isProduction: boolean;
  environmentLabel: string;
  navGroups: NavGroup[];
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setCollapsed(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.roles) return item.roles.includes(user.role);
      if (item.ownerOnly) return user.role === "OWNER";
      return true;
    }),
  }));

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const compact = collapsed && !mobileOpen;

  const sidebar = (
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col border-r border-white/10 bg-surface-inverse text-foreground-inverse ${
        compact ? "w-[4.5rem] p-3" : "w-64 p-6"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={compact ? "hidden" : "block"}>
          <p className="admin-brand text-2xl">OSTON</p>
          <p className="admin-brand mt-1 text-[0.65rem] uppercase text-accent">CMS</p>
        </div>
        <button
          type="button"
          className="hidden rounded px-2 py-1 text-xs uppercase text-foreground-inverse/70 hover:bg-white/5 lg:inline"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {compact ? "›" : "‹"}
        </button>
      </div>
      {!isProduction ? (
        <p className={`mt-4 bg-warning/20 px-2 py-1 text-[0.65rem] uppercase text-warning ${compact ? "text-center" : ""}`}>
          {compact ? "STG" : environmentLabel}
        </p>
      ) : null}
      <button
        type="button"
        className="mt-6 border border-white/15 px-2 py-2 text-left text-xs text-foreground-inverse/70 hover:bg-white/5"
        onClick={() => setPaletteOpen(true)}
      >
        {compact ? "⌘K" : "Buscar ou criar…  ⌘K"}
      </button>
      <nav aria-label="Navegação administrativa" className="mt-8 grid min-h-0 flex-1 content-start gap-6 overflow-y-auto overscroll-contain text-sm">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {compact ? null : (
              <p className="mb-2 px-2 text-[0.6rem] uppercase text-foreground-inverse/40">{group.label}</p>
            )}
            <div className="grid gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  title={item.label}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded px-2 py-2 hover:bg-white/5 ${isActive(item.href) ? "bg-white/10" : ""} ${compact ? "text-center" : ""}`}
                >
                  {compact ? item.label.slice(0, 1) : item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <form action={logoutAction} className="mt-6">
        <button type="submit" className="text-xs uppercase text-accent">
          Sair
        </button>
      </form>
      {compact ? null : (
        <p className="mt-6 text-xs text-foreground-inverse/60">
          {user.name}
          <br />
          {user.role}
        </p>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen lg:flex">
      <div className="sticky top-0 hidden h-dvh shrink-0 self-start lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <button type="button" className="text-sm" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            Menu
          </button>
          <p className="admin-brand text-sm">OSTON</p>
          <button type="button" className="text-sm" onClick={() => setPaletteOpen(true)}>
            ⌘K
          </button>
        </div>
        <div className="min-w-0 p-6 pb-24 md:p-10">{children}</div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
