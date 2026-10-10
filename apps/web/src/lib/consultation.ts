export const DEFAULT_CONSULTATION_PHONE = "5511994520877";
export const DEFAULT_CONSULTATION_MESSAGE =
  "Olá! Vim pelo site da OSTON e gostaria de saber mais sobre as coleções de panelas, valores e condições.";

/** One destination for public consultation links, including an unconfigured CMS. */
export function consultationUrl(phone: string | null | undefined, message?: string): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const destination = /^\d{10,15}$/.test(digits) ? digits : DEFAULT_CONSULTATION_PHONE;
  const text = message?.trim() || DEFAULT_CONSULTATION_MESSAGE;
  return `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
}
