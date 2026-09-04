import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/lib/repo";
import { prisma } from "@/lib/prisma";

export async function generateStaticParams() {
  const pages = await prisma.page.findMany({ where: { status: "published" }, select: { slug: true } });
  return pages.map((p) => ({ slug: p.slug }));
}

// Long-form buying-guide pages get Article structured data; policy/legal pages (terms, privacy, etc.) don't.
const GUIDE_SLUGS = new Set(["best-budget-pickleball-paddle", "cheapest-pickleball-paddle", "foam-pickleball-paddle-guide"]);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription ?? undefined,
    alternates: { canonical: `/pages/${page.slug}` },
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleLd = GUIDE_SLUGS.has(page.slug)
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.title,
        description: page.seoDescription ?? undefined,
        datePublished: page.createdAt.toISOString(),
        dateModified: page.updatedAt.toISOString(),
        author: { "@type": "Organization", name: "Robinhood Pickleball" },
        publisher: { "@type": "Organization", name: "Robinhood Pickleball", url: siteUrl },
        mainEntityOfPage: `${siteUrl}/pages/${page.slug}`,
      }
    : null;

  return (
    <div className="container-x max-w-3xl py-14">
      {articleLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />}
      <h1 className="text-4xl font-extrabold">{page.title}</h1>
      <div
        className="prose prose-lg mt-8 max-w-none text-ink-soft [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-3"
        dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
      />
    </div>
  );
}
