export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border border-border bg-surface p-5 md:p-6">
      <header>
        <h2 className="text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-foreground-muted">{description}</p> : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export const fieldClass =
  "w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-1.5 text-sm">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs text-foreground-muted">{hint}</span> : null}
    </label>
  );
}
