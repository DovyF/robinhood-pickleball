import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType, PaymentStatus } from "@/lib/enums";

// Stripe requires the raw body for signature verification.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 400 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await markOrderPaid(orderId, pi.id, typeof pi.latest_charge === "string" ? pi.latest_charge : undefined);
        prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.PURCHASE, orderId, value: pi.amount / 100 } }).catch(() => {});
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.FAILED } }).catch(() => {});
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const order = await prisma.order.findFirst({ where: { stripeChargeId: charge.id } });
      if (order) {
        const refundedTotal = charge.amount_refunded / 100;
        await prisma.order.update({
          where: { id: order.id },
          data: {
            refundedTotal,
            paymentStatus: refundedTotal >= order.total ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
