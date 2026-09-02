import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export default async function LogsPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } });

  return (
    <div>
      <PageHeader title="Activity log" subtitle="Recent admin actions" />
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Detail</th>
            </tr></thead>
            <tbody className="divide-y divide-cream-dark">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-cream-dark/30 transition">
                  <td className="px-4 py-3 text-ink-soft">{formatDate(l.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3 text-ink">{l.user?.email ?? "system"}</td>
                  <td className="px-4 py-3"><code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs text-ink">{l.action}</code></td>
                  <td className="px-4 py-3 text-ink-soft">{l.entity ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{l.detail ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
