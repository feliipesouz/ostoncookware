import Link from "next/link";
import { mediaSrc } from "@/lib/api";
import type { Collection } from "@/lib/content";
import { ArrowUpRightIcon } from "./icons";
import { SiteImage } from "./site-image";

export function RelatedCollections({ collections }: { collections: Collection[] }) {
  if (!collections.length) return null;

  return (
    <section
      className="site-grid mt-14 border-t border-border pt-8 md:mt-20 md:pt-10"
      aria-labelledby="palette-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Mais possibilidades</p>
          <h2 id="palette-heading" className="font-display mt-3 text-3xl md:text-4xl">
            Explore outras coleções.
          </h2>
        </div>
        <Link href="/colecoes" className="button-link">
          Comparar as cores <ArrowUpRightIcon />
        </Link>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:mt-8 lg:grid-cols-5 lg:gap-x-5">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={`/colecoes/${collection.slug}`}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
                {collection.coverImage ? (
                  <SiteImage
                    src={mediaSrc(collection.coverImage.url)}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 19vw"
                    className="object-cover object-[center_55%] motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-2xl text-foreground-muted">
                    {collection.name}
                  </span>
                )}
              </div>
              <span className="mt-3 flex items-center justify-between gap-2 text-sm">
                {collection.name}
                <ArrowUpRightIcon className="h-4 w-4 shrink-0" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
