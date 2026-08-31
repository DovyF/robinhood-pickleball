import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, safeJson } from "@/lib/utils";
import { discountLabel } from "@/lib/orders";
import { taxRateForState } from "@/lib/tax";
import type { CheckoutAddress } from "@/lib/orders";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, fulfillments: true },
  });
  if (!order) notFound();

  const ship = safeJson<CheckoutAddress | null>(order.shippingAddressJson, null);
  const discount = order.discountCode ? await prisma.discountCode.findUnique({ where: { code: order.discountCode }, select: { type: true, value: true } }) : null;
  const taxRate = taxRateForState(ship?.state);

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-forest-700 hover:underline">← Back to orders</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Order #{order.orderNumber}</h2>
          <p className="text-sm text-ink-soft">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {(order.status === "paid" || order.status === "fulfilled" || order.status === "partially_fulfilled") && (
        <Link href="/returns" className="mt-3 inline-block text-sm font-semibold text-forest-700 hover:underline">Need to return something from this order? →</Link>
      )}

      {order.trackingNumber && (
        <div className="mt-4 rounded-xl bg-forest-50 p-4">
          <p className="text-sm">Your order shipped via <strong>{order.shippingCarrier}</strong></p>
          <p className="text-sm">Tracking number: <strong>{order.trackingNumber}</strong></p>
          {order.trackingUrl && <a href={order.trackingUrl} className="btn btn-outline mt-2 !py-1.5 text-sm" target="_blank" rel="noreferrer">Track package</a>}
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-panel p-5 shadow-card">
        <ul className="divide-y divide-cream-dark">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-cream">
                {i.imageUrl && <Image src={i.imageUrl} alt={i.title} fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{i.title}</p>
                {i.variantTitle && <p className="text-ink-soft">{i.variantTitle}</p>}
                <p className="text-ink-soft">{formatMoney(i.price)} × {i.quantity}</p>
              </div>
              <span className="font-semibold">{formatMoney(i.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-cream-dark pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal ({order.items.reduce((n, i) => n + i.quantity, 0)} item{order.items.reduce((n, i) => n + i.quantity, 0) !== 1 ? "s" : ""})</dt><dd>{formatMoney(order.subtotal)}</dd></div>
          {order.discountTotal > 0 && <div className="flex justify-between text-forest-600"><dt>{discountLabel(order.discountCode, discount)}</dt><dd>−{formatMoney(order.discountTotal)}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping{order.shippingMethod ? ` — ${order.shippingMethod}` : ""}</dt><dd>{order.shippingTotal === 0 ? "Free" : formatMoney(order.shippingTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Tax{ship?.state ? ` (${ship.state}${taxRate > 0 ? ` · ${(taxRate * 100).toFixed(2)}%` : ""})` : ""}</dt><dd>{formatMoney(order.taxTotal)}</dd></div>
          <div className="flex justify-between border-t border-cream-dark pt-2 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div>
          {order.refundedTotal > 0 && <div className="flex justify-between text-red-600"><dt>Refunded</dt><dd>−{formatMoney(order.refundedTotal)}</dd></div>}
        </dl>
      </div>

      {ship && (
        <div className="mt-6 rounded-2xl bg-panel p-5 shadow-card">
          <h3 className="mb-2 font-bold">Shipping address</h3>
          <p className="text-sm text-ink-soft">
            {ship.firstName} {ship.lastName}<br />
            {ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}<br />
            {ship.city}, {ship.state} {ship.postalCode}
          </p>
        </div>
      )}
    </div>
  );
}
