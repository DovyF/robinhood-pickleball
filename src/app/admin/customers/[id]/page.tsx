import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, StatCard } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { items: true } }, addresses: true },
  });
  if (!customer) notFound();

  const paid = customer.orders.filter((o) => o.paymentStatus === "paid");
  const spent = paid.reduce((s, o) => s + o.total, 0);
  const aov = paid.length ? spent / paid.length : 0;

  return (
    <div>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700"><ArrowLeft size={15} /> Customers</Link>
      <h1 className="text-2xl font-extrabold">{customer.name ?? customer.email}</h1>
      <p className="text-sm text-ink-soft">{customer.email} · Joined {formatDate(customer.createdAt)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total spent" value={formatMoney(spent)} />
        <StatCard label="Orders" value={String(paid.length)} />
        <StatCard label="Avg order value" value={formatMoney(aov)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card title="Order history">
          {customer.orders.length === 0 ? (
            <p className="text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {customer.orders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-cream">
                  <span className="font-medium">#{o.orderNumber}</span>
                  <span className="text-ink-soft">{formatDate(o.createdAt)}</span>
                  <StatusBadge status={o.status} />
                  <span className="font-semibold">{formatMoney(o.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card title="Addresses">
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-ink-soft">No saved addresses.</p>
          ) : (
            customer.addresses.map((a) => (
              <p key={a.id} className="mb-3 text-sm text-ink-soft">
                {a.firstName} {a.lastName}<br />{a.line1}<br />{a.city}, {a.state} {a.postalCode}
              </p>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
