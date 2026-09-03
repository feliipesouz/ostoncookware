export function Manifesto({
  eyebrow,
  headline,
  body,
}: {
  eyebrow: string;
  headline: string;
  body: string;
}) {
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="site-grid grid gap-12 md:grid-cols-12">
        <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand md:col-span-3">
          {eyebrow}
        </p>
        <div className="md:col-span-8">
          <div className="editorial-rule" />
          <blockquote className="font-display mt-8 text-3xl leading-tight md:text-5xl">{headline}</blockquote>
          <p className="mt-8 max-w-2xl text-base leading-8 text-foreground-muted">{body}</p>
        </div>
      </div>
    </section>
  );
}

export function Differentials({
  title,
  items,
}: {
  title: string;
  items: { title: string; text: string }[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-border bg-background py-24">
      <div className="site-grid">
        <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">A experiência OSTON</p>
        <h2 className="font-display mt-3 max-w-3xl text-4xl md:text-6xl">{title}</h2>
        <div className="mt-16 grid gap-px bg-border md:grid-cols-4">
          {items.map((item) => (
            <article key={item.title} className="bg-background p-8">
              <h3 className="font-display text-2xl">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-foreground-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
