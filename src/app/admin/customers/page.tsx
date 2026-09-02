import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function AdminCustomers() {
  const customers = await prisma.user.findMany({
    where: { role: "customer" },
    orderBy: { createdAt: "desc" },
    include: { orders: { where: { paymentStatus: "paid" }, select: { total: true } } },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} />
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Spent</th><th className="px-4 py-3">Joined</th>
            </tr></thead>
            <tbody className="divide-y divide-cream-dark">
              {customers.map((c) => {
                const spent = c.orders.reduce((s, o) => s + o.total, 0);
                return (
                  <tr key={c.id} className="hover:bg-cream-dark/30 transition">
                    <td className="px-4 py-3"><Link href={`/admin/customers/${c.id}`} className="font-medium text-forest-700 hover:text-gold-300">{c.name ?? "—"}</Link></td>
                    <td className="px-4 py-3 text-ink-soft">{c.email}</td>
                    <td className="px-4 py-3 text-ink">{c.orders.length}</td>
                    <td className="px-4 py-3 font-semibold text-gold-300">{formatMoney(spent)}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
