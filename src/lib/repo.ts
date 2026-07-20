import { prisma } from "@/lib/prisma";
import { parseList, safeJson } from "@/lib/utils";

// Shared read helpers used across storefront pages. Keep queries here so
// includes/shape stay consistent and cache-friendly.

export const productInclude = {
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: { position: "asc" } },
  options: { orderBy: { position: "asc" } },
} as const;

export type ProductWithRelations = Awaited<ReturnType<typeof getProductBySlug>>;

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "active" },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      options: { orderBy: { position: "asc" } },
      reviews: { where: { status: "published" }, orderBy: { createdAt: "desc" } },
      collections: { include: { collection: true } },
    },
  });
}

export async function getActiveProducts(opts?: {
  take?: number;
  skip?: number;
  featured?: boolean;
  type?: string;
  search?: string;
  sort?: string;
  tag?: string;
}) {
  const where: Record<string, unknown> = { status: "active" };
  if (opts?.featured) where.featured = true;
  if (opts?.type) where.productType = opts.type;
  if (opts?.tag) where.tags = { contains: opts.tag };
  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search } },
      { description: { contains: opts.search } },
      { tags: { contains: opts.search } },
      { productType: { contains: opts.search } },
    ];
  }

  const orderBy = sortToOrderBy(opts?.sort);

  return prisma.product.findMany({
    where,
    include: { images: { orderBy: { position: "asc" }, take: 2 }, variants: { take: 1, orderBy: { position: "asc" } } },
    orderBy,
    take: opts?.take,
    skip: opts?.skip,
  });
}

export function sortToOrderBy(sort?: string) {
  switch (sort) {
    case "price-asc":
      return { price: "asc" as const };
    case "price-desc":
      return { price: "desc" as const };
    case "newest":
      return { createdAt: "desc" as const };
    case "title-asc":
      return { title: "asc" as const };
    case "best-selling":
    default:
      return { salesCount: "desc" as const };
  }
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findFirst({ where: { slug, status: "active" } });
}

export async function getCollectionProducts(collectionId: string, sort?: string) {
  const rows = await prisma.collectionProduct.findMany({
    where: { collectionId },
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" }, take: 2 }, variants: { take: 1, orderBy: { position: "asc" } } },
      },
    },
    orderBy: sort ? undefined : { position: "asc" },
  });
  let products = rows.map((r) => r.product).filter((p) => p.status === "active");
  if (sort) {
    const cmp: Record<string, (a: typeof products[number], b: typeof products[number]) => number> = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "title-asc": (a, b) => a.title.localeCompare(b.title),
      newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      "best-selling": (a, b) => b.salesCount - a.salesCount,
    };
    if (cmp[sort]) products = [...products].sort(cmp[sort]);
  }
  return products;
}

export async function getRelatedProducts(product: { id: string; productType?: string | null }, take = 4) {
  return prisma.product.findMany({
    where: { status: "active", id: { not: product.id }, productType: product.productType ?? undefined },
    include: { images: { orderBy: { position: "asc" }, take: 2 }, variants: { take: 1, orderBy: { position: "asc" } } },
    take,
    orderBy: { salesCount: "desc" },
  });
}

export async function getNavigation(menu: "main" | "footer") {
  return prisma.navigationItem.findMany({ where: { menu, parentId: null }, orderBy: { position: "asc" }, include: { children: { orderBy: { position: "asc" } } } });
}

export async function getHomepageSections() {
  const rows = await prisma.homepageSection.findMany({ where: { enabled: true }, orderBy: { position: "asc" } });
  return rows.map((r) => ({ ...r, settings: safeJson<Record<string, unknown>>(r.settingsJson, {}) }));
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getPageBySlug(slug: string) {
  return prisma.page.findFirst({ where: { slug, status: "published" } });
}

export function productTags(product: { tags: string }): string[] {
  return parseList(product.tags);
}
