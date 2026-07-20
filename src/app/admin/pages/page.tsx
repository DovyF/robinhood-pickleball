import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { PagesManager } from "@/components/admin/PagesManager";

export default async function AdminPages() {
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <PageHeader title="Pages" subtitle={`${pages.length} pages`} />
      <PagesManager
        pages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, bodyHtml: p.bodyHtml, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription }))}
      />
    </div>
  );
}
