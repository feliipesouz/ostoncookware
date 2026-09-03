import Link from "next/link";
import type { Collection } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { SiteImage } from "./site-image";

export function FeaturedCollections({
  collections,
  title = "Presença à mesa",
  subtitle = "Coleções",
}: {
  collections: Collection[];
  title?: string;
  subtitle?: string;
}) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-24 md:py-32">
      <div className="site-grid">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">{subtitle}</p>
            <h2 className="font-display mt-3 text-4xl md:text-6xl">{title}</h2>
          </div>
          <Link href="/colecoes" className="text-[0.7rem] tracking-[0.28em] uppercase text-foreground-muted">
            Ver todas
          </Link>
        </div>
        <div className="mt-16 space-y-8">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={`/colecoes/${collection.slug}`}
              className={`group grid overflow-hidden bg-surface md:grid-cols-12 ${index % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}
            >
              <div className="relative aspect-[4/5] md:col-span-7 md:aspect-[16/11]">
                {collection.coverImage ? (
                  <SiteImage
                    src={mediaSrc(collection.coverImage.url)}
                    alt={collection.coverImage.alt ?? collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full w-full bg-graphite" />
                )}
              </div>
              <div className="flex flex-col justify-end gap-5 p-8 md:col-span-5 md:p-12">
                {collection.isDemo ? (
                  <p className="text-[0.65rem] tracking-[0.32em] uppercase text-brand">Conteúdo DEMO</p>
                ) : null}
                <h3 className="font-display text-4xl md:text-5xl">{collection.name}</h3>
                <p className="max-w-sm text-sm leading-7 text-foreground-muted">
                  {collection.shortDescription}
                </p>
                <span className="text-[0.7rem] tracking-[0.28em] uppercase">Explorar coleção</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
