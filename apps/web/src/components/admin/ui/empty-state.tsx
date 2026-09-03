import Link from "next/link";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-base">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">{description}</p> : null}
      {action?.href ? (
        <Link href={action.href} className="mt-6 inline-block bg-foreground px-4 py-2 text-sm text-foreground-inverse">
          {action.label}
        </Link>
      ) : action?.onClick ? (
        <button type="button" onClick={action.onClick} className="mt-6 bg-foreground px-4 py-2 text-sm text-foreground-inverse">
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
