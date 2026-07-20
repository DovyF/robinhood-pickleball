"use server";

import { revalidatePath } from "next/cache";
import { addToCart, updateLine, removeLine, setDiscountCode, getCartView } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";

export async function addToCartAction(productId: string, variantId: string | null, quantity = 1) {
  const cart = await addToCart(productId, variantId, quantity);
  // fire-and-forget analytics
  prisma.analyticsEvent
    .create({ data: { type: AnalyticsEventType.ADD_TO_CART, productId } })
    .catch(() => {});
  revalidatePath("/cart");
  return cart;
}

export async function updateLineAction(lineId: string, quantity: number) {
  const cart = await updateLine(lineId, quantity);
  revalidatePath("/cart");
  return cart;
}

export async function removeLineAction(lineId: string) {
  const cart = await removeLine(lineId);
  revalidatePath("/cart");
  return cart;
}

export async function applyDiscountAction(code: string) {
  const normalized = code.trim().toUpperCase();
  const discount = await prisma.discountCode.findFirst({
    where: { code: normalized, status: "active" },
  });
  if (!discount) {
    return { ok: false, error: "That code isn't valid." as string };
  }
  if (discount.endsAt && discount.endsAt < new Date()) {
    return { ok: false, error: "That code has expired." };
  }
  await setDiscountCode(normalized);
  revalidatePath("/cart");
  return { ok: true, code: normalized };
}

export async function removeDiscountAction() {
  await setDiscountCode(null);
  revalidatePath("/cart");
  return { ok: true };
}

export async function refreshCartAction() {
  return getCartView();
}
