import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { Package, Heart, MapPin } from "lucide-react";

export default async function AccountOverview() {
  const session = await auth();
  if (!session?.user) return null; // layout redirects; guard the parallel render race
  const userId = session.user.id;

  const [orders, wishlistCount, addressCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.address.count({ where: { userId } }),
    prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3, include: { items: true } }),
  ]);

  const stats = [
    { label: "Orders", value: orders, icon: Package, href: "/account/orders" },
    { label: "Wishlist", value: wishlistCount, icon: Heart, href: "/account/wishlist" },
    { label: "Addresses", value: addressCount, icon: MapPin, href: "/account/addresses" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl bg-panel p-5 shadow-card transition hover:shadow-lift">
            <s.icon size={22} className="text-forest-600" />
            <p className="mt-3 text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-forest-700 hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-2xl bg-panel p-8 text-center shadow-card">
            <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
            <Link href="/products" className="btn btn-primary mt-4">Start shopping</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between rounded-2xl bg-panel p-4 shadow-card transition hover:shadow-lift">
                  <div>
                    <p className="font-semibold">Order #{o.orderNumber}</p>
                    <p className="text-sm text-ink-soft">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(o.total)}</p>
                    <span className="text-xs font-medium capitalize text-forest-600">{o.status}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
