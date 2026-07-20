import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/repo";
import { prisma } from "@/lib/prisma";
import { ProductCard, type CardProduct } from "@/components/product/ProductCard";
import { CollectionToolbar } from "@/components/product/CollectionToolbar";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse all tournament-grade pickleball paddles, balls, bags, and apparel.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const [products, typeRows] = await Promise.all([
    getActiveProducts({ sort: sp.sort, type: sp.type }),
    prisma.product.findMany({ where: { status: "active" }, select: { productType: true }, distinct: ["productType"] }),
  ]);
  const types = typeRows.map((t) => t.productType).filter(Boolean) as string[];

  return (
    <div className="container-x py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Shop All</h1>
        <p className="mt-2 text-ink-soft">Tournament-grade gear at honest prices.</p>
      </header>
      <CollectionToolbar count={products.length} types={types} />
      {products.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">No products match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p as unknown as CardProduct} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
