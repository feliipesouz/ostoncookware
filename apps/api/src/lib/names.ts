export function firstName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    return "Alguém";
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase() ?? "";
  return value.length > 0 ? value : null;
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
