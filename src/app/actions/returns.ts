"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/upload";
import { sendReturnRequestReceived, sendReturnRequestAlert } from "@/lib/email";
import { ReturnReason, ReturnStatus, RETURN_REASON_LABELS } from "@/lib/enums";

const RETURN_WINDOW_DAYS = 21;

/** Look up an order for a return request. Works for guests and account holders alike. */
export async function lookupOrderForReturnAction(input: { orderNumber: string; email: string }) {
  const orderNumber = parseInt(input.orderNumber.replace(/[^0-9]/g, ""), 10);
  const email = input.email.trim().toLowerCase();
  if (!orderNumber || !email) return { ok: false as const, error: "Enter a valid order number and email." };

  const order = await prisma.order.findFirst({
    where: { orderNumber, email },
    include: { items: true, returnRequests: true },
  });
  if (!order) return { ok: false as const, error: "We couldn't find an order with that number and email." };
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded") {
    return { ok: false as const, error: "This order hasn't been paid yet, so there's nothing to return." };
  }

  const deliveredOrPlacedAt = order.fulfilledAt ?? order.paidAt ?? order.createdAt;
  const daysSince = Math.floor((Date.now() - deliveredOrPlacedAt.getTime()) / (1000 * 60 * 60 * 24));
  const withinWindow = daysSince <= RETURN_WINDOW_DAYS;

  const alreadyRequestedItemIds = new Set(
    order.returnRequests
      .filter((r) => r.status !== ReturnStatus.DENIED)
      .flatMap((r) => {
        try {
          return (JSON.parse(r.itemsJson) as { orderItemId: string }[]).map((i) => i.orderItemId);
        } catch {
          return [];
        }
      })
  );

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.orderNumber,
    withinWindow,
    daysSince,
    items: order.items
      .filter((i) => !alreadyRequestedItemIds.has(i.id))
      .map((i) => ({ id: i.id, title: i.title, variantTitle: i.variantTitle, imageUrl: i.imageUrl, quantity: i.quantity, price: i.price })),
  };
}

export async function uploadReturnPhotoAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false as const, error: "No file" };
  if (!file.type.startsWith("image/")) return { ok: false as const, error: "Please upload an image file." };
  if (file.size > 8 * 1024 * 1024) return { ok: false as const, error: "Image is too large (max 8MB)." };
  try {
    const { url } = await saveImage(file);
    return { ok: true as const, url };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

const requestSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().email(),
  reason: z.enum([
    ReturnReason.DAMAGED_IN_TRANSIT,
    ReturnReason.DEFECTIVE,
    ReturnReason.WRONG_ITEM,
    ReturnReason.NOT_AS_DESCRIBED,
    ReturnReason.CHANGED_MIND,
    ReturnReason.OTHER,
  ]),
  note: z.string().max(2000).optional(),
  items: z.array(z.object({ orderItemId: z.string(), quantity: z.number().int().min(1) })).min(1),
  photoUrls: z.array(z.string()).max(6).optional(),
});

export async function requestReturnAction(raw: unknown) {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please fill out the return form completely." };
  const input = parsed.data;
  const email = input.email.trim().toLowerCase();

  const order = await prisma.order.findFirst({ where: { id: input.orderId, email }, include: { items: true } });
  if (!order) return { ok: false as const, error: "We couldn't verify that order." };

  // Used-condition or non-defect returns require photos so staff can inspect before approving.
  if (input.reason !== ReturnReason.WRONG_ITEM && (!input.photoUrls || input.photoUrls.length === 0)) {
    return { ok: false as const, error: "Please add at least one photo of the item." };
  }

  const validItemIds = new Set(order.items.map((i) => i.id));
  if (!input.items.every((i) => validItemIds.has(i.orderItemId))) {
    return { ok: false as const, error: "One of the selected items doesn't belong to this order." };
  }

  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      email,
      reason: input.reason,
      note: input.note,
      itemsJson: JSON.stringify(input.items),
      photoUrls: input.photoUrls?.length ? JSON.stringify(input.photoUrls) : null,
    },
  });

  sendReturnRequestReceived(email, order.orderNumber).catch(() => {});
  sendReturnRequestAlert(order.orderNumber, RETURN_REASON_LABELS[input.reason] ?? input.reason).catch(() => {});

  return { ok: true as const, id: returnRequest.id };
}
