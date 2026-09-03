import { prisma } from "@oston/database";
import {
  defaultFooterNavigation,
  defaultHeaderNavigation,
  navigationItemsSchema,
  navigationKeySchema,
  navigationWriteSchema,
  type NavigationItem,
  type NavigationKey,
  type NavigationWrite,
} from "@oston/contracts";

function defaultsFor(key: NavigationKey): NavigationItem[] {
  return key === "header" ? defaultHeaderNavigation : defaultFooterNavigation;
}

function mapItem(row: {
  id: string;
  label: string;
  href: string;
  kind: string;
  enabled: boolean;
  sortOrder: number;
  parentId: string | null;
}): NavigationItem {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    kind: row.kind === "EXTERNAL" ? "EXTERNAL" : "INTERNAL",
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    parentId: row.parentId,
  };
}

async function ensureMenu(key: NavigationKey) {
  return prisma.navigationMenu.upsert({
    where: { key },
    create: { key, name: key === "header" ? "Cabeçalho" : "Rodapé" },
    update: {},
    include: { items: { orderBy: { sortOrder: "asc" as const } } },
  });
}

export async function getNavigation(key: string) {
  const parsedKey = navigationKeySchema.parse(key);
  const menu = await ensureMenu(parsedKey);
  const items = menu.items.length > 0 ? menu.items.map(mapItem) : defaultsFor(parsedKey);
  if (menu.items.length === 0) {
    await persistItems(menu.id, items);
  }
  const parsed = navigationItemsSchema.safeParse(items);
  return { key: parsedKey, items: parsed.success ? parsed.data : defaultsFor(parsedKey) };
}

async function persistItems(menuId: string, items: NavigationItem[]) {
  await prisma.navigationItem.deleteMany({ where: { menuId } });
  const roots = items.filter((item) => !item.parentId);
  const children = items.filter((item) => item.parentId);
  if (roots.length > 0) {
    await prisma.navigationItem.createMany({
      data: roots.map((item, sortOrder) => ({
        id: item.id,
        menuId,
        label: item.label,
        href: item.href,
        kind: item.kind,
        enabled: item.enabled,
        sortOrder,
        parentId: null,
      })),
    });
  }
  if (children.length > 0) {
    await prisma.navigationItem.createMany({
      data: children.map((item, sortOrder) => ({
        id: item.id,
        menuId,
        label: item.label,
        href: item.href,
        kind: item.kind,
        enabled: item.enabled,
        sortOrder: roots.length + sortOrder,
        parentId: item.parentId,
      })),
    });
  }
}

export async function updateNavigation(key: string, input: NavigationWrite) {
  const parsedKey = navigationKeySchema.parse(key);
  const payload = navigationWriteSchema.parse(input);
  const menu = await ensureMenu(parsedKey);
  const items = payload.items.map((item, sortOrder) => ({ ...item, sortOrder }));
  await persistItems(menu.id, items);
  return { key: parsedKey, items };
}

export async function getPublicNavigation() {
  const [header, footer] = await Promise.all([getNavigation("header"), getNavigation("footer")]);
  return {
    header: header.items.filter((item) => item.enabled),
    footer: footer.items.filter((item) => item.enabled),
  };
}
