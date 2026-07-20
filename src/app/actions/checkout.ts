"use server";

import { z } from "zod";
import { getShippingRates } from "@/lib/shipping";
import { priceCart, createPendingOrder, markOrderPaid, type CheckoutAddress } from "@/lib/orders";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnalyticsEventType } from "@/lib/enums";

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().default("US"),
  phone: z.string().optional(),
});

/** Get shipping rates + a totals preview for the entered address. */
export async function quoteCheckoutAction(input: {
  cartToken: string;
  address: CheckoutAddress;
  discountCode?: string | null;
}) {
  const { totals, lines } = await priceCart({
    cartToken: input.cartToken,
    state: input.address.state,
    shippingAmount: 0,
    discountCode: input.discountCode,
  });
  const rates = await getShippingRates({
    subtotal: totals.subtotal - totals.discountTotal,
    totalWeightGrams: lines.reduce((s, l) => s + l.weightGrams * l.quantity, 0),
    state: input.address.state,
    postalCode: input.address.postalCode,
    country: input.address.country,
  });
  return { rates, subtotal: totals.subtotal, discountTotal: totals.discountTotal, freeShipping: totals.freeShipping };
}

/** Final totals for a chosen shipping rate (server-authoritative). */
export async function totalsForRateAction(input: {
  cartToken: string;
  address: CheckoutAddress;
  shippingAmount: number;
  discountCode?: string | null;
}) {
  const { totals } = await priceCart({
    cartToken: input.cartToken,
    state: input.address.state,
    shippingAmount: input.shippingAmount,
    discountCode: input.discountCode,
  });
  return totals;
}

const placeSchema = z.object({
  cartToken: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingRateId: z.string(),
  shippingAmount: z.number(),
  shippingLabel: z.string(),
  shippingCarrier: z.string(),
  discountCode: z.string().nullable().optional(),
});

/**
 * Create the order. If Stripe is configured, returns a PaymentIntent client
 * secret to confirm on the client. Otherwise runs in demo mode and marks the
 * order paid immediately so the full funnel is testable without keys.
 */
export async function placeOrderAction(raw: unknown) {
  const parsed = placeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please check your details and try again." };
  const input = parsed.data;
  const session = await auth();

  const { order, totals } = await createPendingOrder({
    ...input,
    userId: session?.user?.id ?? null,
  });

  prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.BEGIN_CHECKOUT, orderId: order.id, value: totals.total } }).catch(() => {});

  if (stripeConfigured()) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(totals.total * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, orderNumber: String(order.orderNumber) },
      receipt_email: input.email,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.id } });
    return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber, clientSecret: intent.client_secret, demo: false as const };
  }

  // Demo mode — no Stripe keys yet
  await markOrderPaid(order.id);
  prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.PURCHASE, orderId: order.id, value: totals.total } }).catch(() => {});
  return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber, clientSecret: null, demo: true as const };
}

/** Called by the success page after Stripe confirms client-side (webhook is the source of truth). */
export async function confirmOrderAction(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false };
  // If webhook hasn't landed yet but PI is set, verify with Stripe directly.
  if (order.paymentStatus !== "paid" && stripeConfigured() && order.stripePaymentIntentId) {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (pi.status === "succeeded") {
      await markOrderPaid(order.id, pi.id, typeof pi.latest_charge === "string" ? pi.latest_charge : undefined);
    }
  }
  return { ok: true };
}
