import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { confirmOrderAction } from "@/app/actions/checkout";
import { formatMoney, safeJson } from "@/lib/utils";
import type { CheckoutAddress } from "@/lib/orders";
import { ConfirmPixel } from "@/components/checkout/ConfirmPixel";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  await confirmOrderAction(orderId);
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) notFound();

  const ship = safeJson<CheckoutAddress | null>(order.shippingAddressJson, null);

  return (
    <div className="container-x max-w-2xl py-16">
      <ConfirmPixel value={order.total} orderNumber={order.orderNumber} />
      <div className="text-center">
        <CheckCircle2 size={56} className="mx-auto text-forest-600" />
        <h1 className="mt-4 text-3xl font-extrabold">Thank you, {ship?.firstName || "friend"}!</h1>
        <p className="mt-2 text-ink-soft">Your order <strong>#{order.orderNumber}</strong> is confirmed. A receipt is on its way to {order.email}.</p>
      </div>

      <div className="mt-10 rounded-2xl bg-panel p-6 shadow-card">
        <h2 className="mb-4 font-bold">Order summary</h2>
        <ul className="divide-y divide-cream-dark">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-cream">
                {i.imageUrl && <Image src={i.imageUrl} alt={i.title} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{i.title}</p>
                {i.variantTitle && <p className="text-ink-soft">{i.variantTitle}</p>}
                <p className="text-ink-soft">Qty {i.quantity}</p>
              </div>
              <span className="text-sm font-semibold">{formatMoney(i.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-cream-dark pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(order.subtotal)}</dd></div>
          {order.discountTotal > 0 && <div className="flex justify-between text-forest-600"><dt>Discount</dt><dd>−{formatMoney(order.discountTotal)}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shippingTotal === 0 ? "Free" : formatMoney(order.shippingTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd>{formatMoney(order.taxTotal)}</dd></div>
          <div className="flex justify-between border-t border-cream-dark pt-2 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div>
        </dl>
      </div>

      {ship && (
        <div className="mt-6 rounded-2xl bg-panel p-6 shadow-card">
          <h2 className="mb-2 font-bold">Shipping to</h2>
          <p className="text-sm text-ink-soft">
            {ship.firstName} {ship.lastName}<br />
            {ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}<br />
            {ship.city}, {ship.state} {ship.postalCode}
          </p>
          <p className="mt-2 text-sm">Method: <strong>{order.shippingMethod}</strong></p>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/products" className="btn btn-primary">Continue shopping</Link>
        <Link href="/account/orders" className="btn btn-outline">View orders</Link>
      </div>
    </div>
  );
}
