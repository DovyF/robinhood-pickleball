import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductEditor, type EditorProduct } from "@/components/admin/ProductEditor";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { position: "asc" } }, options: true },
  });
  if (!product) notFound();

  const hasRealVariants = product.variants.length > 1 || (product.variants[0] && product.variants[0].title !== "Default");

  const initial: EditorProduct = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    productType: product.productType ?? "",
    vendor: product.vendor ?? "",
    status: product.status as EditorProduct["status"],
    featured: product.featured,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    costPerItem: product.costPerItem,
    weightGrams: product.weightGrams,
    tags: product.tags,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    optionName: product.options[0]?.name ?? "",
    images: product.images.map((i) => i.url),
    variants: hasRealVariants
      ? product.variants.map((v) => ({
          id: v.id,
          title: v.title,
          sku: v.sku ?? "",
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          option1: v.option1,
          inventoryQty: v.inventoryQty,
          trackInventory: v.trackInventory,
          weightGrams: v.weightGrams,
        }))
      : [],
  };

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700"><ArrowLeft size={15} /> Products</Link>
      <h1 className="mb-6 text-2xl font-extrabold">{product.title}</h1>
      <ProductEditor initial={initial} />
    </div>
  );
}
