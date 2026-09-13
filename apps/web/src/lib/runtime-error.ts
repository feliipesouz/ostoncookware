export function publicRuntimeError(error: unknown) {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
    return `${error.name}: ${error.message}${cause}`.replace(
      /[a-z][a-z0-9+.-]*:\/\/[^\s"'\\]+/gi,
      "[redacted]",
    );
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error).replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'\\]+/gi, "[redacted]");
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return String(error);
}
