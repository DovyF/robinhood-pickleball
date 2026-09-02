import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, AdminButton, EmptyState, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { formatMoney } from "@/lib/utils";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.q) where.title = { contains: sp.q };

  const products = await prisma.product.findMany({
    where,
    include: { images: { take: 1, orderBy: { position: "asc" } }, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products`}
        action={<AdminButton href="/admin/products/new" variant="primary"><Plus size={16} /> Add product</AdminButton>}
      />

      <div className="mb-4 flex gap-2">
        {[["", "All"], ["active", "Active"], ["draft", "Draft"], ["archived", "Archived"]].map(([v, l]) => (
          <Link key={v} href={v ? `/admin/products?status=${v}` : "/admin/products"} className={`rounded-full px-3 py-1.5 text-sm font-medium ${(sp.status ?? "") === v ? "bg-forest-700 text-white" : "bg-panel text-ink-soft border border-cream-dark hover:border-forest-600"}`}>
            {l}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products yet" subtitle="Add your first product to start selling." action={<AdminButton href="/admin/products/new" variant="primary">Add product</AdminButton>} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Inventory</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {products.map((p) => {
                  const stock = p.variants.reduce((s, v) => s + (v.trackInventory ? v.inventoryQty : 0), 0);
                  const tracked = p.variants.some((v) => v.trackInventory);
                  return (
                    <tr key={p.id} className="hover:bg-cream-dark/30 transition">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                            {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-contain p-0.5" />}
                          </div>
                          <span className="font-medium text-ink">{p.title}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">{tracked ? <span className={stock === 0 ? "text-red-500" : "text-ink"}>{stock} in stock</span> : <span className="text-ink-soft">Not tracked</span>}</td>
                      <td className="px-4 py-3 text-ink">{formatMoney(p.price)}</td>
                      <td className="px-4 py-3 text-ink-soft">{p.productType ?? "—"}</td>
                      <td className="px-4 py-3 text-right"><ProductRowActions id={p.id} slug={p.slug} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
