import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/repo";
import { ProductView } from "@/components/product/ProductView";
import { Reviews } from "@/components/product/Reviews";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { status: "active" }, select: { slug: true }, take: 50 });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    // Use the bare product name; the root layout template appends the brand suffix.
    title: product.title,
    description: product.seoDescription || product.description.slice(0, 155),
    openGraph: {
      title: product.title,
      description: product.seoDescription || product.description.slice(0, 155),
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();


  // analytics (fire and forget)
  prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.PRODUCT_VIEW, productId: product.id } }).catch(() => {});

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: product.variants.some((v) => !v.trackInventory || v.inventoryQty > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }
        : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-x py-8">
        <nav className="mb-6 text-sm text-ink-soft">
          <Link href="/" className="hover:text-forest-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-forest-700">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.title}</span>
        </nav>

        <ProductView
          product={{
            id: product.id,
            title: product.title,
            productType: product.productType,
            descriptionHtml: product.descriptionHtml,
            rating: product.rating,
            reviewCount: product.reviewCount,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            images: product.images.map((i) => ({ url: i.url, altText: i.altText })),
            variants: product.variants.map((v) => ({
              id: v.id,
              title: v.title,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              option1: v.option1,
              inventoryQty: v.inventoryQty,
              trackInventory: v.trackInventory,
            })),
            options: product.options.map((o) => ({ name: o.name, values: o.values })),
          }}
        />
      </div>

      <Reviews
        productId={product.id}
        slug={product.slug}
        rating={product.rating}
        reviews={product.reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verified: r.verified,
          createdAt: r.createdAt,
        }))}
      />

    </>
  );
}
