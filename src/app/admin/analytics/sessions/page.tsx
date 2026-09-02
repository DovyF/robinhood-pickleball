import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { getSessionsList, rangeFromParam } from "@/lib/analytics";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { formatMoney, formatDate } from "@/lib/utils";

const DEVICE_ICON = { Mobile: Smartphone, Tablet: Tablet, Desktop: Monitor } as const;

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const effectiveRange = rangeParam ?? "all";
  const range = rangeFromParam(effectiveRange);
  const sessions = await getSessionsList(range, 1000);

  return (
    <div>
      <Link href="/admin/analytics" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700 transition"><ArrowLeft size={15} /> Back to Analytics</Link>
      <PageHeader title="Sessions" subtitle={`${sessions.length} sessions${effectiveRange === "all" ? " all time" : " in range"}`} action={<DateRangePicker current={effectiveRange} />} />

      <Link href="/admin/analytics/legacy" className="mb-4 inline-block text-sm font-semibold text-forest-700 hover:text-gold-300 transition">
        View events from before session tracking (product views, add-to-carts, etc. before Sept 1) →
      </Link>

      {sessions.length === 0 ? (
        <EmptyState title="No sessions yet" subtitle="Visitor sessions will appear here as people browse the store." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Pages</th>
                  <th className="px-4 py-3">Entry page</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {sessions.map((s) => {
                  const Icon = DEVICE_ICON[s.device as keyof typeof DEVICE_ICON] ?? Monitor;
                  return (
                    <tr key={s.sessionId} className="hover:bg-cream-dark/30 transition">
                      <td className="px-4 py-3">
                        <Link href={`/admin/analytics/sessions/${s.sessionId}`} className="font-medium text-forest-700 hover:text-gold-300">
                          {formatDate(s.firstSeen, { dateStyle: "medium", timeStyle: "short" })}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{s.durationSec < 60 ? `${Math.round(s.durationSec)}s` : `${Math.floor(s.durationSec / 60)}m ${Math.round(s.durationSec % 60)}s`}</td>
                      <td className="px-4 py-3">{s.pageViews}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-soft">{s.entryPath}</td>
                      <td className="px-4 py-3">{s.source}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-ink-soft"><Icon size={14} /> {s.device} · {s.browser}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.converted ? (
                          <span className="font-semibold text-forest-500">{formatMoney(s.orderValue)}{s.userEmail ? ` · ${s.userEmail}` : ""}</span>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
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
