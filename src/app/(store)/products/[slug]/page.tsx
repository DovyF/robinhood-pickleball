import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/repo";
import { ProductView } from "@/components/product/ProductView";
import { Reviews } from "@/components/product/Reviews";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";
import { currentSessionId } from "@/lib/session-tracking";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { status: "active" }, select: { slug: true }, take: 50 });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const title = product.seoTitle || product.title;
  const description = product.seoDescription || product.description.slice(0, 155);
  return {
    // seoTitle already carries the full search-facing title, so skip the root layout's brand-suffix template for this page.
    title: { absolute: title },
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();


  // analytics (fire and forget)
  currentSessionId().then((sessionId) =>
    prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.PRODUCT_VIEW, productId: product.id, sessionId } })
  ).catch(() => {});

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/products` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${siteUrl}/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
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
