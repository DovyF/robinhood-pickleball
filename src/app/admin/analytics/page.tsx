import { getDashboardMetrics, getSalesSeries, getTopProducts, getDetailedTrafficSources, getFunnel, getAbandonedCarts, getCustomerLifetimeValue, getSessionMetrics, getTopPages, rangeFromParam } from "@/lib/analytics";
import { StatCard, Card, PageHeader } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/SalesChart";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = rangeFromParam(rangeParam);

  const [metrics, series, topProducts, detailedSources, funnel, abandoned, ltv, sessionMetrics, topPages] = await Promise.all([
    getDashboardMetrics(range),
    getSalesSeries(range),
    getTopProducts(range, 8),
    getDetailedTrafficSources(range),
    getFunnel(range),
    getAbandonedCarts(range),
    getCustomerLifetimeValue(),
    getSessionMetrics(range),
    getTopPages(range, 8),
  ]);

  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Store performance" action={<DateRangePicker current={rangeParam ?? "30d"} />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(metrics.revenue)} change={metrics.revenueChange} />
        <StatCard label="Orders" value={String(metrics.orderCount)} />
        <StatCard label="Avg order value" value={formatMoney(metrics.aov)} />
        <StatCard label="Conversion rate" value={`${metrics.conversionRate.toFixed(2)}%`} />
        <StatCard label="Sessions" value={String(sessionMetrics.totalSessions)} />
        <StatCard label="Avg session duration" value={`${sessionMetrics.avgDuration.toFixed(0)}s`} hint={`${sessionMetrics.avgPagesPerSession.toFixed(1)} pages/session`} />
        <StatCard label="Bounce rate" value={`${sessionMetrics.bounceRate.toFixed(1)}%`} />
        <StatCard label="Customer LTV" value={formatMoney(ltv.avgLtv)} hint={`${ltv.customers} buyers`} />
      </div>

      <div className="mt-6"><Card title="Sales over time"><SalesChart data={series} /></Card></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Conversion funnel">
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.stage}>
                <div className="mb-1 flex justify-between text-sm"><span>{f.stage}</span><span className="font-semibold">{f.count}{i > 0 && funnel[0].count > 0 ? ` · ${((f.count / funnel[0].count) * 100).toFixed(1)}%` : ""}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-cream-dark"><div className="h-full rounded-full bg-forest-600" style={{ width: `${(f.count / maxFunnel) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Traffic sources">
          {detailedSources.length === 0 ? <p className="text-sm text-ink-soft">No traffic data yet.</p> : (
            <div className="space-y-3">
              {detailedSources.slice(0, 8).map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex justify-between text-sm"><span>{s.source}</span><span className="font-semibold">{s.visits} ({s.pct.toFixed(0)}%)</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-cream-dark"><div className="h-full rounded-full bg-forest-600" style={{ width: `${s.pct}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Top pages">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-ink-soft"><th className="pb-2">Page</th><th className="pb-2 text-right">Views</th></tr></thead>
            <tbody>
              {topPages.map((p, i) => (
                <tr key={p.path} className="border-t border-cream-dark"><td className="py-2 font-mono text-xs">{p.path}</td><td className="py-2 text-right font-semibold">{p.views}</td></tr>
              ))}
              {topPages.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-ink-soft">No page views yet.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card title="Top products">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-ink-soft"><th className="pb-2">Product</th><th className="pb-2 text-right">Units</th><th className="pb-2 text-right">Revenue</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.productId ?? i} className="border-t border-cream-dark"><td className="py-2">{p.title}</td><td className="py-2 text-right">{p.units}</td><td className="py-2 text-right font-semibold">{formatMoney(p.revenue)}</td></tr>
              ))}
              {topProducts.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-ink-soft">No sales yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Abandoned carts">
          {abandoned.length === 0 ? <p className="text-sm text-ink-soft">No abandoned carts.</p> : (
            <div className="space-y-2">
              {abandoned.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm"><span className="text-ink-soft">{c.email}</span><span>{c.items} items · <strong>{formatMoney(c.value)}</strong></span></div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Visitor insights">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-ink-soft font-bold mb-1">Avg. session duration</p>
              <p className="text-2xl font-bold text-gold-300">{sessionMetrics.avgDuration.toFixed(0)}</p>
              <p className="text-xs text-ink-soft">seconds</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-soft font-bold mb-1">Pages per session</p>
              <p className="text-2xl font-bold text-gold-300">{sessionMetrics.avgPagesPerSession.toFixed(1)}</p>
              <p className="text-xs text-ink-soft">avg pages viewed</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-soft font-bold mb-1">Bounce rate</p>
              <p className="text-2xl font-bold" style={{ color: sessionMetrics.bounceRate > 50 ? "#ef4444" : "#a3e635" }}>{sessionMetrics.bounceRate.toFixed(1)}%</p>
              <p className="text-xs text-ink-soft">single-page visits</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
