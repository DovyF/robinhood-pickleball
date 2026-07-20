import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionBySlug, getCollectionProducts } from "@/lib/repo";
import { prisma } from "@/lib/prisma";
import { ProductCard, type CardProduct } from "@/components/product/ProductCard";
import { CollectionToolbar } from "@/components/product/CollectionToolbar";

export async function generateStaticParams() {
  const cols = await prisma.collection.findMany({ where: { status: "active" }, select: { slug: true } });
  return cols.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const col = await getCollectionBySlug(slug);
  if (!col) return { title: "Collection not found" };
  return {
    title: col.seoTitle || col.title,
    description: col.seoDescription || col.description,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const col = await getCollectionBySlug(slug);
  if (!col) notFound();

  const products = await getCollectionProducts(col.id, sp.sort);

  return (
    <div className="container-x py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{col.title}</h1>
        {col.description && <p className="mt-2 max-w-2xl text-ink-soft">{col.description}</p>}
      </header>
      <CollectionToolbar count={products.length} />
      {products.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">No products in this collection yet.</p>
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
