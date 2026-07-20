import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status === "unfulfilled") where.fulfillmentStatus = "unfulfilled";
  else if (sp.status) where.status = sp.status;
  if (sp.q) where.OR = [{ email: { contains: sp.q } }, { orderNumber: parseInt(sp.q) || 0 }];

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, include: { items: true }, take: 100 }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: true,
      where: { paymentStatus: { not: "pending" } }
    })
  ]);

  const tabs = [
    ["", "All orders"],
    ["paid", "Paid"],
    ["unfulfilled", "Unfulfilled"],
    ["fulfilled", "Fulfilled"],
    ["refunded", "Refunded"]
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders`} action={
        <form method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Search by email or #order"
            defaultValue={sp.q ?? ""}
            className="input w-64"
          />
          <button type="submit" className="btn btn-primary text-xs">Search</button>
        </form>
      } />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(([v, l]) => (
          <Link
            key={v}
            href={v ? `/admin/orders?status=${v}` : "/admin/orders"}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              (sp.status ?? "") === v
                ? "bg-forest-700 text-black"
                : "bg-panel text-ink border border-cream-dark hover:border-forest-600"
            }`}
          >
            {l}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          subtitle="Orders will appear here as customers check out."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-dark/30 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest-700 hover:text-gold-300">
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">{o.email}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.fulfillmentStatus} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-gold-300">{formatMoney(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
