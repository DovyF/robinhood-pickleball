import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { RETURN_REASON_LABELS } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export default async function AdminReturns({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;

  const returns = await prisma.returnRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { order: true },
    take: 100,
  });

  const tabs = [
    ["", "All"],
    ["requested", "Requested"],
    ["approved", "Approved"],
    ["received", "Received"],
    ["refunded", "Refunded"],
    ["denied", "Denied"],
  ];

  return (
    <div>
      <PageHeader title="Returns" subtitle={`${returns.length} return requests`} />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(([v, l]) => (
          <Link
            key={v}
            href={v ? `/admin/returns?status=${v}` : "/admin/returns"}
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

      {returns.length === 0 ? (
        <EmptyState title="No return requests" subtitle="Customer return requests will appear here." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-dark/30 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/returns/${r.id}`} className="font-semibold text-forest-700 hover:text-gold-300">
                        #{r.order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">{r.email}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{RETURN_REASON_LABELS[r.reason] ?? r.reason}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
