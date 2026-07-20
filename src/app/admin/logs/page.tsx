import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export default async function LogsPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } });

  return (
    <div>
      <PageHeader title="Activity log" subtitle="Recent admin actions" />
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-cream-dark text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Detail</th>
          </tr></thead>
          <tbody className="divide-y divide-cream-dark">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-cream/50">
                <td className="px-4 py-3 text-ink-soft">{formatDate(l.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-3">{l.user?.email ?? "system"}</td>
                <td className="px-4 py-3"><code className="rounded bg-cream px-1.5 py-0.5 text-xs">{l.action}</code></td>
                <td className="px-4 py-3 text-ink-soft">{l.entity ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{l.detail ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
