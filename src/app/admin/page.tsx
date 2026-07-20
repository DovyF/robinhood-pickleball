import Link from "next/link";
import { getDashboardMetrics, getSalesSeries, getTopProducts, rangeFromParam } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { StatCard, Card, PageHeader } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/SalesChart";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { formatMoney, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = rangeFromParam(rangeParam);

  const [metrics, series, topProducts, recentOrders, lowStock] = await Promise.all([
    getDashboardMetrics(range),
    getSalesSeries(range),
    getTopProducts(range, 5),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
    prisma.productVariant.findMany({ where: { trackInventory: true, inventoryQty: { lte: 5 } }, include: { product: true }, take: 6, orderBy: { inventoryQty: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your store at a glance" action={<DateRangePicker current={rangeParam ?? "30d"} />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(metrics.revenue)} change={metrics.revenueChange} />
        <StatCard label="Orders" value={String(metrics.orderCount)} hint={`${metrics.sessions} sessions`} />
        <StatCard label="Avg order value" value={formatMoney(metrics.aov)} />
        <StatCard label="Conversion rate" value={`${metrics.conversionRate.toFixed(2)}%`} hint={`${metrics.returningCustomers} returning`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Sales over time" className="lg:col-span-2">
          <SalesChart data={series} />
        </Card>
        <Card title="Top products">
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">No sales in this period.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.productId ?? i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-cream text-xs font-bold">{i + 1}</span>
                    <span className="line-clamp-1">{p.title}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatMoney(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-semibold text-forest-700">View all</Link>}>
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-cream">
                <span className="font-medium">#{o.orderNumber}</span>
                <span className="text-ink-soft">{formatDate(o.createdAt)}</span>
                <StatusBadge status={o.status} />
                <span className="font-semibold">{formatMoney(o.total)}</span>
              </Link>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-ink-soft">No orders yet.</p>}
          </div>
        </Card>

        <Card title="Low stock alerts" action={<Link href="/admin/products" className="text-sm font-semibold text-forest-700">Manage</Link>}>
          <div className="space-y-2">
            {lowStock.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-cream">
                <span className="line-clamp-1">{v.product.title}{v.title !== "Default" ? ` · ${v.title}` : ""}</span>
                <span className={v.inventoryQty === 0 ? "font-bold text-red-600" : "font-semibold text-gold-600"}>{v.inventoryQty} left</span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-ink-soft">All products well stocked. 🎉</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
