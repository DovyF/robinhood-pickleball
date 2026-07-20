"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { sendShippingNotification } from "@/lib/email";
import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@/lib/enums";

const CARRIER_TRACK: Record<string, string> = {
  USPS: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  UPS: "https://www.ups.com/track?tracknum=",
  FedEx: "https://www.fedex.com/fedextrack/?trknbr=",
};

export async function fulfillOrderAction(input: { orderId: string; carrier: string; trackingNumber: string; notify: boolean }) {
  await assertStaff();
  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found" };

  const trackingUrl = input.trackingNumber ? `${CARRIER_TRACK[input.carrier] ?? ""}${input.trackingNumber}` : null;

  await prisma.$transaction(async (tx) => {
    await tx.fulfillment.create({
      data: {
        orderId: order.id,
        status: "shipped",
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl,
        shippedAt: new Date(),
        itemsJson: JSON.stringify(order.items.map((i) => ({ orderItemId: i.id, quantity: i.quantity }))),
      },
    });
    await tx.orderItem.updateMany({ where: { orderId: order.id }, data: { fulfilledQty: 0 } });
    for (const i of order.items) {
      await tx.orderItem.update({ where: { id: i.id }, data: { fulfilledQty: i.quantity } });
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
        status: order.status === OrderStatus.PAID ? OrderStatus.FULFILLED : order.status,
        shippingCarrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl,
        fulfilledAt: new Date(),
      },
    });
  });

  if (input.notify && input.trackingNumber) {
    await sendShippingNotification(order.email, order.orderNumber, input.carrier, input.trackingNumber, trackingUrl ?? undefined).catch(() => {});
  }
  await logAudit("order.fulfill", "order", order.id, input.trackingNumber);
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function updateTrackingAction(orderId: string, carrier: string, trackingNumber: string) {
  await assertStaff();
  const trackingUrl = trackingNumber ? `${CARRIER_TRACK[carrier] ?? ""}${trackingNumber}` : null;
  await prisma.order.update({ where: { id: orderId }, data: { shippingCarrier: carrier, trackingNumber, trackingUrl } });
  await logAudit("order.tracking", "order", orderId, trackingNumber);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function refundOrderAction(input: { orderId: string; amount: number; reason: string; restock: boolean }) {
  await assertStaff();
  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found" };
  const amount = Math.min(input.amount, order.total - order.refundedTotal);
  if (amount <= 0) return { ok: false, error: "Nothing left to refund" };

  // Stripe refund if configured + charge exists
  let stripeRefundId: string | undefined;
  if (stripeConfigured() && order.stripeChargeId) {
    try {
      const refund = await getStripe().refunds.create({ charge: order.stripeChargeId, amount: Math.round(amount * 100), reason: "requested_by_customer" });
      stripeRefundId = refund.id;
    } catch (e) {
      return { ok: false, error: `Stripe refund failed: ${(e as Error).message}` };
    }
  }

  const newRefunded = order.refundedTotal + amount;
  await prisma.$transaction(async (tx) => {
    await tx.refund.create({ data: { orderId: order.id, amount, reason: input.reason, restock: input.restock, stripeRefundId } });
    await tx.order.update({
      where: { id: order.id },
      data: {
        refundedTotal: newRefunded,
        paymentStatus: newRefunded >= order.total ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        status: newRefunded >= order.total ? OrderStatus.REFUNDED : order.status,
      },
    });
    if (input.restock) {
      for (const i of order.items) {
        if (i.variantId) await tx.productVariant.updateMany({ where: { id: i.variantId }, data: { inventoryQty: { increment: i.quantity } } });
      }
    }
  });

  await logAudit("order.refund", "order", order.id, `$${amount.toFixed(2)}`);
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true };
}

export async function cancelOrderAction(orderId: string, reason: string) {
  await assertStaff();
  await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED, cancelReason: reason, cancelledAt: new Date() } });
  await logAudit("order.cancel", "order", orderId, reason);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function markPaidManuallyAction(orderId: string) {
  await assertStaff();
  const { markOrderPaid } = await import("@/lib/orders");
  await markOrderPaid(orderId);
  await logAudit("order.mark_paid", "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
