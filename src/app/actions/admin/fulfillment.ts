"use server";

import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { safeJson } from "@/lib/utils";
import type { CheckoutAddress } from "@/lib/orders";

const GRAMS_PER_OZ = 28.3495;

interface Order {
  id: string;
  orderNumber: number;
  email: string;
  phone?: string | null;
  total: number;
  shippingAddressJson: string;
  items: Array<{ title: string; quantity: number; productId?: string | null; variantId?: string | null }>;
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Pirate Ship has no public API (confirmed via their own support docs:
 * "Pirate Ship doesn't offer an API") — their supported bulk workflow is a
 * flexible spreadsheet upload with labeled columns. This builds a CSV in
 * that format for the admin to import at pirateship.com/orders.
 */
export async function exportOrdersForPirateShip(orders: Order[]) {
  await assertStaff();

  const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId).filter(Boolean)))] as string[];
  const variantIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.variantId).filter(Boolean)))] as string[];
  const [products, variants] = await Promise.all([
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, weightGrams: true } }) : [],
    variantIds.length ? prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, weightGrams: true } }) : [],
  ]);
  const productWeight = new Map(products.map((p) => [p.id, p.weightGrams]));
  const variantWeight = new Map(variants.map((v) => [v.id, v.weightGrams]));

  const header = ["Order Number", "Full Name", "Address Line 1", "Address Line 2", "City", "State", "Zip", "Country", "Email", "Phone", "Weight (oz)", "Order Value", "Contents"];
  const rows = [header];

  for (const order of orders) {
    const ship = safeJson<CheckoutAddress | null>(order.shippingAddressJson, null);
    if (!ship) continue;

    const gramsTotal = order.items.reduce((sum, i) => {
      const grams = (i.variantId && variantWeight.get(i.variantId)) || (i.productId && productWeight.get(i.productId)) || 0;
      return sum + grams * i.quantity;
    }, 0);
    const oz = gramsTotal > 0 ? (gramsTotal / GRAMS_PER_OZ).toFixed(1) : "";

    rows.push([
      `RP-${order.orderNumber}`,
      `${ship.firstName} ${ship.lastName}`,
      ship.line1,
      ship.line2 || "",
      ship.city,
      ship.state,
      ship.postalCode,
      ship.country || "US",
      order.email,
      order.phone || ship.phone || "",
      oz,
      order.total.toFixed(2),
      order.items.map((i) => `${i.quantity}x ${i.title}`).join("; "),
    ].map(csvCell));
  }

  await logAudit("export_pirateship_csv", "order", undefined, `${orders.length} orders`);
  return { ok: true, csv: rows.map((r) => r.join(",")).join("\n") };
}
