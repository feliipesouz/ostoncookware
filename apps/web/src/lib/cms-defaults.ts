export type { HomepageSection } from "@oston/contracts";

export const defaultHeaderNavigation = [
  { label: "A marca", href: "/a-marca", kind: "INTERNAL" as const, enabled: true, sortOrder: 0 },
  { label: "Coleções", href: "/colecoes", kind: "INTERNAL" as const, enabled: true, sortOrder: 1 },
  { label: "Contato", href: "/contato", kind: "INTERNAL" as const, enabled: true, sortOrder: 2 },
];

export const defaultFooterNavigation = [
  { label: "A marca", href: "/a-marca", kind: "INTERNAL" as const, enabled: true, sortOrder: 0 },
  { label: "Coleções", href: "/colecoes", kind: "INTERNAL" as const, enabled: true, sortOrder: 1 },
  { label: "Contato", href: "/contato", kind: "INTERNAL" as const, enabled: true, sortOrder: 2 },
];

export { defaultHomepageSections } from "@oston/contracts";
