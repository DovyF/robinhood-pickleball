import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/repo";
import { ProductCard, type CardProduct } from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await getActiveProducts({ search: query }) : [];

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search"}
      </h1>
      <p className="mt-1 text-ink-soft">{query ? `${products.length} products found` : "Type a query to search."}</p>
      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as unknown as CardProduct} />
          ))}
        </div>
      )}
      {query && products.length === 0 && (
        <p className="py-16 text-center text-ink-soft">No products found. Try a different search.</p>
      )}
    </div>
  );
}
