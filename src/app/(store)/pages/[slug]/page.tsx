import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/lib/repo";
import { prisma } from "@/lib/prisma";

export async function generateStaticParams() {
  const pages = await prisma.page.findMany({ where: { status: "published" }, select: { slug: true } });
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page not found" };
  return { title: page.seoTitle || page.title, description: page.seoDescription ?? undefined };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="text-4xl font-extrabold">{page.title}</h1>
      <div
        className="prose prose-lg mt-8 max-w-none text-ink-soft [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-3"
        dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
      />
    </div>
  );
}
