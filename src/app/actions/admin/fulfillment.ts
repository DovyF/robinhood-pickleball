"use server";

import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { safeJson } from "@/lib/utils";
import type { CheckoutAddress } from "@/lib/orders";

const PIRATESHIP_API = "https://api.pirateship.com";
const PIRATESHIP_KEY = process.env.PIRATESHIP_API_KEY;

interface PirateShipLabel {
  label_id: string;
  label_download: {
    pdf: string;
    zpl: string;
  };
  tracking_number: string;
  carrier: string;
}

interface Order {
  id: string;
  orderNumber: number;
  email: string;
  total: number;
  shippingMethod?: string | null;
  shippingAddressJson: string;
  items: Array<{ title: string; quantity: number }>;
}

/** Generate PirateShip labels for selected orders */
export async function generatePirateShipLabel(orders: Order[]) {
  try {
    await assertStaff();

    if (!PIRATESHIP_KEY) {
      return { ok: false, error: "PirateShip API key not configured" };
    }

    const labels: PirateShipLabel[] = [];

    for (const order of orders) {
      const ship = safeJson<CheckoutAddress | null>(
        order.shippingAddressJson,
        null
      );

      if (!ship) {
        console.warn(`Order ${order.id} has no shipping address`);
        continue;
      }

      // Call PirateShip API to create label
      const labelRes = await fetch(`${PIRATESHIP_API}/labels/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Pirateship-API-Key": PIRATESHIP_KEY,
        },
        body: JSON.stringify({
          carrier: "USPS", // Default; could be made configurable
          service_code: "usps_priority_mail",
          label_format: "pdf",
          to_address: {
            name: `${ship.firstName} ${ship.lastName}`,
            street1: ship.line1,
            street2: ship.line2 || "",
            city: ship.city,
            state: ship.state,
            zip: ship.postalCode,
            country: ship.country || "US",
          },
          from_address: {
            name: "Robinhood Pickleball",
            street1: process.env.SHIPFROM_STREET || "1 Robinhood Lane",
            city: process.env.SHIPFROM_CITY || "Austin",
            state: process.env.SHIPFROM_STATE || "TX",
            zip: process.env.SHIPFROM_ZIP || "78701",
            country: "US",
          },
          parcel: {
            length: 12,
            width: 9,
            height: 4,
            weight: 2, // Paddle approximate weight
          },
          order_number: `RP-${order.orderNumber}`,
          contents: order.items.map((i) => i.title).join(", "),
        }),
      });

      if (!labelRes.ok) {
        console.error("PirateShip API error:", await labelRes.text());
        continue;
      }

      const label = (await labelRes.json()) as PirateShipLabel;
      labels.push(label);

      // Update order with tracking info
      await prisma.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: label.tracking_number,
          shippingCarrier: label.carrier,
        },
      });

      await logAudit("generate_label", "order", order.id, label.tracking_number);
    }

    return { ok: true, labels, count: labels.length };
  } catch (err) {
    console.error("Label generation error:", err);
    return { ok: false, error: "Failed to generate labels" };
  }
}

/** Mark orders as fulfilled */
export async function fulfillOrdersAction(orderIds: string[]) {
  try {
    await assertStaff();

    const result = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { fulfillmentStatus: "fulfilled" },
    });

    for (const id of orderIds) {
      await logAudit("fulfill_order", "order", id);
    }

    return { ok: true, count: result.count };
  } catch (err) {
    console.error("Fulfillment error:", err);
    return { ok: false, error: "Failed to fulfill orders" };
  }
}
