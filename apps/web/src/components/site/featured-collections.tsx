import Link from "next/link";
import type { Collection } from "@/lib/content";
import { ArrowIcon } from "./icons";
import { CollectionExplorer } from "./collection-explorer";

export function FeaturedCollections({
  collections,
  title = "Encontre seu tom.",
  subtitle = "As coleções OSTON",
}: {
  collections: Collection[];
  title?: string;
  subtitle?: string;
}) {
  if (collections.length === 0) return null;
  return (
    <section className="collections-section" id="colecoes-em-destaque">
      <div className="site-grid">
        <div className="section-heading-row editorial-enter">
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h2 className="display-title">{title}</h2>
          </div>
          <Link href="/colecoes" className="button-link">
            Ver todas
            <ArrowIcon />
          </Link>
        </div>
        <CollectionExplorer collections={collections} />
      </div>
    </section>
  );
}
