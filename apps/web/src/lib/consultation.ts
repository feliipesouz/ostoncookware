export const DEFAULT_CONSULTATION_PHONE = "5511994520877";

/** One destination for public consultation links, including an unconfigured CMS. */
export function consultationUrl(phone: string | null | undefined, message?: string): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const destination = /^\d{10,15}$/.test(digits) ? digits : DEFAULT_CONSULTATION_PHONE;
  const text = message?.trim() || "Olá, gostaria de conhecer os conjuntos OSTON.";
  return `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
}
