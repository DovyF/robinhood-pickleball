"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { refundOrderAction } from "@/app/actions/admin/orders";
import { sendReturnDecision, sendReturnRefunded } from "@/lib/email";
import { ReturnStatus } from "@/lib/enums";

export async function approveReturnAction(returnId: string, adminNote?: string) {
  await assertStaff();
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
  if (!ret) return { ok: false, error: "Return request not found" };

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: ReturnStatus.APPROVED, adminNote, decidedAt: new Date() },
  });

  sendReturnDecision(ret.email, ret.order.orderNumber, true, adminNote).catch(() => {});
  await logAudit("return.approve", "return_request", returnId, adminNote);
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath("/admin/returns");
  return { ok: true };
}

export async function denyReturnAction(returnId: string, adminNote: string) {
  await assertStaff();
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
  if (!ret) return { ok: false, error: "Return request not found" };
  if (!adminNote.trim()) return { ok: false, error: "Please explain why the return was denied." };

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: ReturnStatus.DENIED, adminNote, decidedAt: new Date() },
  });

  sendReturnDecision(ret.email, ret.order.orderNumber, false, adminNote).catch(() => {});
  await logAudit("return.deny", "return_request", returnId, adminNote);
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath("/admin/returns");
  return { ok: true };
}

export async function markReturnReceivedAction(returnId: string) {
  await assertStaff();
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId } });
  if (!ret) return { ok: false, error: "Return request not found" };

  await prisma.returnRequest.update({ where: { id: returnId }, data: { status: ReturnStatus.RECEIVED } });
  await logAudit("return.received", "return_request", returnId);
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath("/admin/returns");
  return { ok: true };
}

/** Refund the returned line items and mark the return as refunded. Restocks by default — flip off for damaged/used items. */
export async function refundReturnAction(returnId: string, amount: number, restock: boolean) {
  await assertStaff();
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
  if (!ret) return { ok: false, error: "Return request not found" };

  const result = await refundOrderAction({ orderId: ret.orderId, amount, reason: `Return ${ret.id}`, restock });
  if (!result.ok) return result;

  const refund = await prisma.refund.findFirst({ where: { orderId: ret.orderId }, orderBy: { createdAt: "desc" } });
  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: ReturnStatus.REFUNDED, refundId: refund?.id },
  });

  sendReturnRefunded(ret.email, ret.order.orderNumber, amount).catch(() => {});
  await logAudit("return.refund", "return_request", returnId, `$${amount.toFixed(2)}`);
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/orders/${ret.orderId}`);
  return { ok: true };
}
