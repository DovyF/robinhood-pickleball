import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) return null;
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-panel p-10 text-center shadow-card">
        <h2 className="text-lg font-bold">No orders yet</h2>
        <p className="mt-1 text-ink-soft">When you place an order it&apos;ll show up here.</p>
        <Link href="/products" className="btn btn-primary mt-4">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl bg-panel p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-dark pb-4">
            <div>
              <p className="font-bold">Order #{o.orderNumber}</p>
              <p className="text-sm text-ink-soft">Placed {formatDate(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={o.status} />
              <span className="font-semibold">{formatMoney(o.total)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-3">
              {o.items.slice(0, 4).map((i) => (
                <div key={i.id} className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white bg-cream">
                  {i.imageUrl && <Image src={i.imageUrl} alt={i.title} fill sizes="48px" className="object-cover" />}
                </div>
              ))}
            </div>
            <span className="text-sm text-ink-soft">{o.items.length} item{o.items.length > 1 ? "s" : ""}</span>
            <Link href={`/account/orders/${o.id}`} className="ml-auto text-sm font-semibold text-forest-700 hover:underline">View details →</Link>
          </div>
          {o.trackingNumber && (
            <p className="mt-3 text-sm">Tracking: <strong>{o.trackingNumber}</strong> ({o.shippingCarrier})</p>
          )}
        </div>
      ))}
    </div>
  );
}
