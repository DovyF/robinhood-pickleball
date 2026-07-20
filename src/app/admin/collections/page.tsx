import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function AdminCollections() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader title="Collections" subtitle={`${collections.length} collections`} />
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-cream-dark text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3">Title</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Handle</th>
          </tr></thead>
          <tbody className="divide-y divide-cream-dark">
            {collections.map((c) => (
              <tr key={c.id} className="hover:bg-cream/50">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3">{c._count.products}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3"><Link href={`/collections/${c.slug}`} target="_blank" className="text-forest-700 hover:underline">/{c.slug}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-ink-soft">Assign products to collections from each product&apos;s edit page. Automated collection rules can be added via the API.</p>
    </div>
  );
}
