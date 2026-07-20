import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { formatMoney, formatDate, safeJson } from "@/lib/utils";
import type { CheckoutAddress } from "@/lib/orders";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, refunds: true, fulfillments: true, user: true } });
  if (!order) notFound();

  const ship = safeJson<CheckoutAddress | null>(order.shippingAddressJson, null);

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700 transition"><ArrowLeft size={15} /> Back to Orders</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold">Order #{order.orderNumber}</h1>
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={order.fulfillmentStatus} />
          </div>
          <p className="text-sm text-ink-soft">{formatDate(order.createdAt, { dateStyle: "long", timeStyle: "short" })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Total</p>
          <p className="text-3xl font-bold text-gold-300">{formatMoney(order.total)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <OrderActions order={{ id: order.id, orderNumber: order.orderNumber, total: order.total, refundedTotal: order.refundedTotal, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus, carrier: order.shippingCarrier, trackingNumber: order.trackingNumber }} />
          </Card>

          <Card title="Order items">
            <ul className="divide-y divide-cream-dark">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-4 hover:bg-cream-dark/20 px-2 rounded transition">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-cream-dark shrink-0">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-ink">{i.title}</p>
                    {i.variantTitle && <p className="text-ink-soft text-xs">{i.variantTitle}</p>}
                    {i.sku && <p className="text-xs text-ink-soft mt-0.5">SKU: {i.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-soft">{formatMoney(i.price)} each</p>
                    <p className="text-sm font-medium text-ink">× {i.quantity}</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-sm font-semibold text-gold-300">{formatMoney(i.total)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-cream-dark pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-medium">{formatMoney(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && <div className="flex justify-between text-forest-400"><dt>Discount {order.discountCode ? `(${order.discountCode})` : ""}</dt><dd className="font-medium">−{formatMoney(order.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="font-medium">{formatMoney(order.shippingTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="font-medium">{formatMoney(order.taxTotal)}</dd></div>
              <div className="flex justify-between border-t border-cream-dark pt-2 font-bold text-base"><dt>Total</dt><dd className="text-gold-300">{formatMoney(order.total)}</dd></div>
              {order.refundedTotal > 0 && <div className="flex justify-between text-red-500 pt-1"><dt className="font-medium">Refunded</dt><dd className="font-bold">−{formatMoney(order.refundedTotal)}</dd></div>}
            </dl>
          </Card>

          {order.fulfillments.length > 0 && (
            <Card title="Fulfillments">
              {order.fulfillments.map((f) => (
                <div key={f.id} className="text-sm">
                  <p>{f.carrier} · {f.trackingNumber}</p>
                  {f.trackingUrl && <a href={f.trackingUrl} target="_blank" className="text-forest-700 hover:underline">Track →</a>}
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="text-sm font-medium text-ink">{ship ? `${ship.firstName} ${ship.lastName}` : "Guest"}</p>
            <p className="text-sm text-ink-soft">{order.email}</p>
            {order.phone && <p className="text-sm text-ink-soft mt-1">{order.phone}</p>}
            {order.user && <Link href={`/admin/customers/${order.user.id}`} className="mt-3 inline-block text-sm text-forest-700 hover:text-gold-300 transition">View customer →</Link>}
          </Card>
          {ship && (
            <Card title="Shipping address">
              <address className="text-sm text-ink-soft not-italic">
                {ship.firstName} {ship.lastName}<br />
                {ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}<br />
                {ship.city}, {ship.state} {ship.postalCode}<br />
                {ship.country ?? "US"}
              </address>
              <p className="mt-3 text-sm border-t border-cream-dark pt-3">
                <span className="text-ink-soft">Method:</span> <strong className="text-ink ml-1">{order.shippingMethod ?? "—"}</strong>
              </p>
            </Card>
          )}
          {order.refunds.length > 0 && (
            <Card title="Refund history">
              <div className="space-y-2">
                {order.refunds.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b border-cream-dark pb-2 last:border-0">
                    <span className="text-ink-soft">{r.reason || "Refund"}</span>
                    <span className="font-medium text-red-500">−{formatMoney(r.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
