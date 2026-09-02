import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function AdminCollections() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader title="Collections" subtitle={`${collections.length} collections`} />
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Title</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Handle</th>
            </tr></thead>
            <tbody className="divide-y divide-cream-dark">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-cream-dark/30 transition">
                  <td className="px-4 py-3 font-medium text-ink">{c.title}</td>
                  <td className="px-4 py-3 text-ink">{c._count.products}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><Link href={`/collections/${c.slug}`} target="_blank" className="text-forest-700 hover:underline">/{c.slug}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-sm text-ink-soft">Assign products to collections from each product&apos;s edit page. Automated collection rules can be added via the API.</p>
    </div>
  );
}
