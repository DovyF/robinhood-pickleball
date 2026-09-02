import Link from "next/link";
import { ArrowLeft, Eye, Package, ShoppingCart, CreditCard, CheckCircle2, Search as SearchIcon, Circle } from "lucide-react";
import { getLegacyEvents, rangeFromParam } from "@/lib/analytics";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { formatDate } from "@/lib/utils";

const ICONS: Record<string, typeof Eye> = {
  page_view: Eye,
  product_view: Package,
  add_to_cart: ShoppingCart,
  begin_checkout: CreditCard,
  purchase: CheckCircle2,
  search: SearchIcon,
};

export default async function LegacyEventsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const effectiveRange = rangeParam ?? "all";
  const range = rangeFromParam(effectiveRange);
  const events = await getLegacyEvents(range, 1000);

  return (
    <div>
      <Link href="/admin/analytics" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700 transition"><ArrowLeft size={15} /> Back to Analytics</Link>
      <PageHeader
        title="Events before session tracking"
        subtitle={`${events.length} events — recorded before Sept 1, 2026, when session/device tracking went live`}
        action={<DateRangePicker current={effectiveRange} />}
      />

      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
        These predate the analytics rebuild — there&apos;s no session, device, or browser info for them because none of that was ever captured. Page views, product views, add-to-carts, and searches were never tied to a visitor identity at all (no login required to browse). The only real email available is for events tied to an actual order (checkout/purchase) — everything else is anonymous by design of how it was originally built, not a data-loss issue.
      </div>

      {events.length === 0 ? (
        <EmptyState title="No legacy events" subtitle="Nothing recorded before session tracking in this range." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-panel">
                <tr className="border-b border-cream-dark text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {events.map((e, i) => {
                  const Icon = ICONS[e.type] ?? Circle;
                  return (
                    <tr key={i} className="hover:bg-cream-dark/30 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-ink-soft text-xs">{formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "medium" })}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><Icon size={14} className="text-forest-500 shrink-0" /> {e.label}</span></td>
                      <td className="px-4 py-3 text-ink-soft">{e.email ?? "—"}</td>
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
