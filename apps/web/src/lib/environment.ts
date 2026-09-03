export function isStagingBadgeVisible() {
  return process.env.VERCEL_ENV !== "production" || process.env.NODE_ENV !== "production";
}

export function environmentLabel() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
    return "PRODUÇÃO";
  }
  if (process.env.VERCEL_ENV === "production" && process.env.NODE_ENV === "production") {
    return "PRODUÇÃO";
  }
  return "STAGING";
}

export function confirmDestructive(message: string) {
  return window.confirm(`${message}\n\nAmbiente: ${environmentLabel()}`);
}
