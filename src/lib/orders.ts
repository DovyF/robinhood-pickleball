import { prisma } from "@/lib/prisma";
import { computeTotals, type DiscountLike } from "@/lib/pricing";
import { DiscountType, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/lib/enums";
import { sendOrderConfirmation, sendNewOrderAlert, sendShabbosHoldConfirmation } from "@/lib/email";
import { getStripe, stripeConfigured } from "@/lib/stripe";

const ORDER_START = 1001;

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string;
}

export interface DraftOrderInput {
  cartToken: string;
  email: string;
  phone?: string;
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  shippingRateId: string;
  shippingAmount: number;
  shippingLabel: string;
  shippingCarrier: string;
  discountCode?: string | null;
  userId?: string | null;
}

/** Resolve a discount code into a pricing-engine discount definition. */
export async function resolveDiscount(code?: string | null): Promise<DiscountLike | null> {
  if (!code) return null;
  const d = await prisma.discountCode.findFirst({ where: { code: code.toUpperCase(), status: "active" } });
  if (!d) return null;
  if (d.endsAt && d.endsAt < new Date()) return null;
  if (d.usageLimit && d.usageCount >= d.usageLimit) return null;
  return {
    type: d.type,
    value: d.value,
    appliesTo: d.appliesTo,
    targetIds: d.targetJson ? (JSON.parse(d.targetJson) as string[]) : [],
    minSubtotal: d.minSubtotal,
  };
}

/**
 * Recompute authoritative totals for a cart server-side (never trust the client).
 * Returns line snapshots + totals used to create the order.
 */
export async function priceCart(input: {
  cartToken: string;
  state?: string | null;
  shippingAmount: number;
  discountCode?: string | null;
}) {
  const cart = await prisma.cart.findFirst({
    where: { token: input.cartToken, status: "active" },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, collections: true } },
          variant: true,
        },
      },
    },
  });
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  const lines = cart.items.map((it) => {
    const unitPrice = it.variant?.price ?? it.product.price;
    return {
      cartItem: it,
      price: unitPrice,
      quantity: it.quantity,
      weightGrams: it.variant?.weightGrams ?? it.product.weightGrams,
      productId: it.productId,
      collectionIds: it.product.collections.map((c) => c.collectionId),
    };
  });

  const discount = await resolveDiscount(input.discountCode);
  const totals = computeTotals({
    lines: lines.map((l) => ({ price: l.price, quantity: l.quantity, weightGrams: l.weightGrams, productId: l.productId, collectionIds: l.collectionIds })),
    discount,
    shippingAmount: input.shippingAmount,
    state: input.state,
  });

  return { cart, lines, totals, discount };
}

async function nextOrderNumber(): Promise<number> {
  const last = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
  return last ? last.orderNumber + 1 : ORDER_START;
}

/** Create a pending order from a cart (called at checkout, before payment confirmation). */
export async function createPendingOrder(input: DraftOrderInput) {
  const { cart, lines, totals } = await priceCart({
    cartToken: input.cartToken,
    state: input.shippingAddress.state,
    shippingAmount: input.shippingAmount,
    discountCode: input.discountCode,
  });

  const orderNumber = await nextOrderNumber();
  const shipTo = input.shippingAddress;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: input.userId ?? cart.userId ?? undefined,
      email: input.email,
      phone: input.phone,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      discountCode: input.discountCode ?? undefined,
      shippingMethod: input.shippingLabel,
      shippingCarrier: input.shippingCarrier,
      shippingAddressJson: JSON.stringify(shipTo),
      billingAddressJson: JSON.stringify(input.billingAddress ?? shipTo),
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          variantId: l.cartItem.variantId,
          title: l.cartItem.product.title,
          variantTitle: l.cartItem.variant && l.cartItem.variant.title !== "Default" ? l.cartItem.variant.title : null,
          sku: l.cartItem.variant?.sku,
          imageUrl: l.cartItem.product.images[0]?.url,
          price: l.price,
          quantity: l.quantity,
          total: Math.round(l.price * l.quantity * 100) / 100,
        })),
      },
    },
    include: { items: true },
  });

  return { order, totals };
}

/** Mark an order paid: decrement inventory, bump counters, send confirmation. Idempotent. */
export async function markOrderPaid(orderId: string, paymentIntentId?: string, chargeId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  if (order.paymentStatus === PaymentStatus.PAID) return; // idempotent

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: chargeId,
      },
    });

    // Decrement inventory + bump sales counts
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.updateMany({
          where: { id: item.variantId, trackInventory: true },
          data: { inventoryQty: { decrement: item.quantity } },
        });
      }
      if (item.productId) {
        await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } }).catch(() => {});
      }
    }

    // Bump discount usage
    if (order.discountCode) {
      await tx.discountCode.updateMany({ where: { code: order.discountCode }, data: { usageCount: { increment: 1 } } });
    }

    // Convert cart
    await tx.cart.updateMany({ where: { userId: order.userId ?? undefined, status: "active" }, data: { status: "converted" } });
  });

  // Send confirmation + owner alert (outside tx)
  const ship = order.shippingAddressJson ? (JSON.parse(order.shippingAddressJson) as CheckoutAddress) : null;
  const emailData = {
    orderNumber: order.orderNumber,
    email: order.email,
    items: order.items.map((i) => ({ title: i.title, variantTitle: i.variantTitle, quantity: i.quantity, total: i.total })),
    subtotal: order.subtotal,
    shippingTotal: order.shippingTotal,
    taxTotal: order.taxTotal,
    discountTotal: order.discountTotal,
    total: order.total,
    shippingAddress: ship ? { line1: ship.line1, city: ship.city, state: ship.state, postalCode: ship.postalCode } : null,
  };
  await sendOrderConfirmation(emailData).catch(() => {});
  await sendNewOrderAlert({ ...emailData, phone: order.phone, shippingMethod: order.shippingMethod }).catch(() => {});
}

export { DiscountType };

/**
 * Card authorized (held) for Shabbos, not captured. Idempotent — safe to call
 * from both the Stripe webhook and the checkout success-page fallback check.
 */
export async function markOrderAuthorized(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === PaymentStatus.AUTHORIZED || order.paymentStatus === PaymentStatus.PAID) return;

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.AUTHORIZED } });

  if (order.cancelToken && order.captureAfter) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await sendShabbosHoldConfirmation({
      orderNumber: order.orderNumber,
      email: order.email,
      total: order.total,
      captureAfter: order.captureAfter,
      cancelUrl: `${siteUrl}/orders/cancel/${order.id}?token=${order.cancelToken}`,
    }).catch(() => {});
  }
}

/**
 * Capture every card authorization that was held for Shabbos and whose Shabbos
 * has now ended. Used by the scheduled cron job and by the admin manual
 * "capture now" fallback — both just call this.
 */
export async function captureShabbosHolds() {
  if (!stripeConfigured()) return { captured: 0, checked: 0, errors: [] as string[] };

  const due = await prisma.order.findMany({
    where: { paymentStatus: PaymentStatus.AUTHORIZED, captureAfter: { lte: new Date() } },
  });

  const stripe = getStripe();
  let captured = 0;
  const errors: string[] = [];

  for (const order of due) {
    if (!order.stripePaymentIntentId) continue;
    try {
      const pi = await stripe.paymentIntents.capture(order.stripePaymentIntentId);
      await markOrderPaid(order.id, pi.id, typeof pi.latest_charge === "string" ? pi.latest_charge : undefined);
      captured++;
    } catch (e) {
      errors.push(`Order #${order.orderNumber}: ${(e as Error).message}`);
    }
  }

  return { captured, checked: due.length, errors };
}

/** Human-readable label for a discount line on an order — e.g. "Discount — 10% off (SUMMER10)". */
export function discountLabel(code: string | null | undefined, discount: { type: string; value: number } | null): string {
  if (!code) return "Discount";
  if (!discount) return `Discount (${code})`;
  const desc = discount.type === DiscountType.PERCENTAGE ? `${discount.value}% off` : discount.type === DiscountType.FIXED_AMOUNT ? `$${discount.value.toFixed(2)} off` : "Free shipping";
  return `Discount — ${desc} (${code})`;
}
