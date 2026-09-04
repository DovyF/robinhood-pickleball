"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { getShippingRates } from "@/lib/shipping";
import { priceCart, createPendingOrder, markOrderPaid, markOrderAuthorized, type CheckoutAddress } from "@/lib/orders";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnalyticsEventType, PaymentStatus } from "@/lib/enums";
import { currentSessionId } from "@/lib/session-tracking";
import { isShabbosNow, getShabbosWindow } from "@/lib/shabbos";

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
  marketingOptIn: z.boolean().optional(),
});

/**
 * Create the order. If Stripe is configured, returns a PaymentIntent client
 * secret to confirm on the client. Otherwise runs in demo mode and marks the
 * order paid immediately so the full funnel is testable without keys.
 */
const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  line1: "Address",
  city: "City",
  state: "State",
  postalCode: "ZIP code",
  country: "Country",
};

function describeValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Please check your details and try again.";
  const field = issue.path[issue.path.length - 1];
  const label = (typeof field === "string" && FIELD_LABELS[field]) || "One of the fields";
  return `${label} looks invalid — please check it and try again.`;
}

export async function placeOrderAction(raw: unknown) {
  const parsed = placeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: describeValidationError(parsed.error) };
  const input = parsed.data;
  const session = await auth();

  const { order, totals } = await createPendingOrder({
    ...input,
    userId: session?.user?.id ?? null,
  });

  const sessionId = await currentSessionId();
  prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.BEGIN_CHECKOUT, orderId: order.id, value: totals.total, sessionId } }).catch(() => {});

  if (input.marketingOptIn) {
    const normalized = input.email.toLowerCase().trim();
    prisma.user
      .upsert({
        where: { email: normalized },
        update: { marketingOptIn: true },
        create: { email: normalized, marketingOptIn: true, role: "customer" },
      })
      .catch(() => {});
  }

  if (stripeConfigured()) {
    const shabbosNow = await isShabbosNow();
    const shabbosWindow = shabbosNow ? await getShabbosWindow() : null;

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(totals.total * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      capture_method: shabbosNow ? "manual" : "automatic",
      metadata: {
        orderId: order.id,
        orderNumber: String(order.orderNumber),
        sessionId: sessionId ?? "",
        shabbosHold: shabbosNow ? "true" : "false",
      },
      receipt_email: input.email,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: intent.id,
        ...(shabbosWindow ? { captureAfter: shabbosWindow.end, cancelToken: randomUUID() } : {}),
      },
    });
    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: intent.client_secret,
      demo: false as const,
      shabbosHold: shabbosNow,
      captureAfter: shabbosWindow ? shabbosWindow.end.toISOString() : null,
    };
  }

  // Demo mode — no Stripe keys yet
  await markOrderPaid(order.id);
  prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.PURCHASE, orderId: order.id, value: totals.total, sessionId } }).catch(() => {});
  return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber, clientSecret: null, demo: true as const, shabbosHold: false, captureAfter: null };
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
    } else if (pi.status === "requires_capture") {
      // Card authorized (held) for Shabbos — not captured. markOrderAuthorized is idempotent.
      await markOrderAuthorized(order.id);
    }
  }
  return { ok: true };
}

/** Public, token-protected: lets a customer cancel their own Shabbos-held order before capture. */
export async function cancelShabbosHoldAction(orderId: string, token: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.cancelToken || order.cancelToken !== token) {
    return { ok: false as const, error: "Order not found." };
  }
  if (order.paymentStatus !== PaymentStatus.AUTHORIZED) {
    return { ok: false as const, error: "This order has already been processed and can no longer be cancelled here — contact us if you need help." };
  }

  if (stripeConfigured() && order.stripePaymentIntentId) {
    try {
      await getStripe().paymentIntents.cancel(order.stripePaymentIntentId);
    } catch {
      // Already captured/cancelled on Stripe's side — fall through and sync our record.
    }
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "cancelled", paymentStatus: PaymentStatus.CANCELLED },
  });
  return { ok: true as const };
}
