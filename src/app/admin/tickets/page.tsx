import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { LocalTime } from "@/components/admin/LocalTime";
import { safeJson } from "@/lib/utils";

export default async function AdminTickets() {
  const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <PageHeader title="Support tickets" subtitle="Escalated from the AI chat widget — reply directly to the alert email to respond to the customer." />

      {tickets.length === 0 ? (
        <EmptyState title="No tickets yet" subtitle="Questions the AI assistant can't resolve will show up here." />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const messages = safeJson<{ role: string; content: string }[]>(t.transcript, []);
            return (
              <Card key={t.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{t.subject}</p>
                    <p className="text-xs text-ink-soft">{t.email} · <LocalTime date={t.createdAt.toISOString()} options={{ dateStyle: "medium", timeStyle: "short" }} /></p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="space-y-1.5 border-t border-cream-dark pt-3 text-sm">
                  {messages.map((m, i) => (
                    <p key={i}><span className="font-medium text-ink-soft">{m.role === "user" ? "Customer" : "Assistant"}:</span> {m.content}</p>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
