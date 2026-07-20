import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { ContentManager } from "@/components/admin/ContentManager";

export default async function AdminContent() {
  const [sections, mainNav, footerNav] = await Promise.all([
    prisma.homepageSection.findMany({ orderBy: { position: "asc" } }),
    prisma.navigationItem.findMany({ where: { menu: "main" }, orderBy: { position: "asc" } }),
    prisma.navigationItem.findMany({ where: { menu: "footer" }, orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Homepage & Navigation" subtitle="Control what shows on your storefront" />
      <ContentManager
        sections={sections.map((s) => ({ id: s.id, type: s.type, title: s.title, enabled: s.enabled, position: s.position }))}
        mainNav={mainNav.map((n) => ({ id: n.id, label: n.label, url: n.url, position: n.position }))}
        footerNav={footerNav.map((n) => ({ id: n.id, label: n.label, url: n.url, position: n.position }))}
      />
    </div>
  );
}
