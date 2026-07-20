import { round2 } from "@/lib/utils";
import { DiscountType } from "@/lib/enums";
import { calculateTax } from "@/lib/tax";

export interface PriceableLine {
  price: number;
  quantity: number;
  weightGrams?: number;
  productId?: string;
  collectionIds?: string[];
}

export interface DiscountLike {
  type: string; // percentage | fixed_amount | free_shipping
  value: number;
  appliesTo?: string; // all | collection | product
  targetIds?: string[];
  minSubtotal?: number | null;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  freeShipping: boolean;
  totalWeightGrams: number;
  itemCount: number;
}

/** Compute the discount amount for a given subtotal + discount definition. */
export function computeDiscount(lines: PriceableLine[], discount?: DiscountLike | null): {
  amount: number;
  freeShipping: boolean;
} {
  if (!discount) return { amount: 0, freeShipping: false };

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  if (discount.minSubtotal && subtotal < discount.minSubtotal) {
    return { amount: 0, freeShipping: false };
  }

  if (discount.type === DiscountType.FREE_SHIPPING) {
    return { amount: 0, freeShipping: true };
  }

  // Determine the base the discount applies to
  const applicable =
    discount.appliesTo && discount.appliesTo !== "all"
      ? lines.filter((l) => {
          const ids = discount.targetIds ?? [];
          if (discount.appliesTo === "product") return l.productId && ids.includes(l.productId);
          if (discount.appliesTo === "collection")
            return (l.collectionIds ?? []).some((c) => ids.includes(c));
          return true;
        })
      : lines;

  const base = applicable.reduce((s, l) => s + l.price * l.quantity, 0);

  let amount = 0;
  if (discount.type === DiscountType.PERCENTAGE) {
    amount = base * (discount.value / 100);
  } else if (discount.type === DiscountType.FIXED_AMOUNT) {
    amount = Math.min(discount.value, base);
  }
  return { amount: round2(amount), freeShipping: false };
}

export interface ComputeTotalsInput {
  lines: PriceableLine[];
  discount?: DiscountLike | null;
  shippingAmount?: number;
  state?: string | null;
  taxShipping?: boolean;
  giftCardBalance?: number;
}

/** Single source of truth for cart/checkout/order totals. */
export function computeTotals({
  lines,
  discount,
  shippingAmount = 0,
  state,
  taxShipping = false,
}: ComputeTotalsInput): CartTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0));
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const totalWeightGrams = lines.reduce((s, l) => s + (l.weightGrams ?? 0) * l.quantity, 0);

  const { amount: discountTotal, freeShipping } = computeDiscount(lines, discount);
  const subtotalAfterDiscount = round2(Math.max(0, subtotal - discountTotal));

  const shippingTotal = freeShipping ? 0 : round2(shippingAmount);
  const taxTotal = calculateTax({ subtotalAfterDiscount, shipping: shippingTotal, state, taxShipping });

  const total = round2(subtotalAfterDiscount + shippingTotal + taxTotal);

  return {
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    total,
    freeShipping,
    totalWeightGrams,
    itemCount,
  };
}
