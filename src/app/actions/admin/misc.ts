"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { nanoid } from "nanoid";

/* ---------------- Discounts ---------------- */
export async function createDiscountAction(input: { code: string; type: string; value: number; minSubtotal?: number | null; usageLimit?: number | null; endsAt?: string | null }) {
  await assertStaff();
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Code required" };
  const exists = await prisma.discountCode.findUnique({ where: { code } });
  if (exists) return { ok: false, error: "Code already exists" };
  await prisma.discountCode.create({
    data: {
      code, type: input.type, value: input.value,
      minSubtotal: input.minSubtotal ?? null,
      usageLimit: input.usageLimit ?? null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      status: "active",
    },
  });
  await logAudit("discount.create", "discount", code);
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function toggleDiscountAction(id: string, status: string) {
  await assertStaff();
  await prisma.discountCode.update({ where: { id }, data: { status } });
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function deleteDiscountAction(id: string) {
  await assertStaff();
  await prisma.discountCode.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/discounts");
  return { ok: true };
}

/* ---------------- Gift cards ---------------- */
export async function createGiftCardAction(input: { value: number; recipientEmail?: string; message?: string }) {
  await assertStaff();
  const code = `GC-${nanoid(4).toUpperCase()}-${nanoid(4).toUpperCase()}`;
  await prisma.giftCard.create({
    data: { code, initialValue: input.value, balance: input.value, recipientEmail: input.recipientEmail, message: input.message, status: "active" },
  });
  await logAudit("giftcard.create", "giftcard", code);
  revalidatePath("/admin/gift-cards");
  return { ok: true, code };
}

/* ---------------- Settings ---------------- */
export async function saveSettingsAction(settings: Record<string, string>) {
  await assertStaff();
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  await logAudit("settings.update", "settings");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/* ---------------- Pages ---------------- */
export async function savePageAction(input: { id?: string; title: string; slug: string; bodyHtml: string; status: string; seoTitle?: string; seoDescription?: string }) {
  await assertStaff();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const data = { title: input.title, slug, bodyHtml: input.bodyHtml, status: input.status, seoTitle: input.seoTitle, seoDescription: input.seoDescription };
  if (input.id) await prisma.page.update({ where: { id: input.id }, data });
  else await prisma.page.create({ data });
  await logAudit("page.save", "page", slug);
  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${slug}`);
  return { ok: true };
}

export async function deletePageAction(id: string) {
  await assertStaff();
  await prisma.page.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/pages");
  return { ok: true };
}

/* ---------------- Homepage sections ---------------- */
export async function updateSectionAction(id: string, patch: { enabled?: boolean; position?: number; title?: string; settingsJson?: string }) {
  await assertStaff();
  await prisma.homepageSection.update({ where: { id }, data: patch });
  revalidatePath("/admin/content");
  revalidatePath("/");
  return { ok: true };
}

/* ---------------- Navigation ---------------- */
export async function saveNavItemAction(input: { id?: string; menu: string; label: string; url: string; position: number }) {
  await assertStaff();
  if (input.id) await prisma.navigationItem.update({ where: { id: input.id }, data: { label: input.label, url: input.url, position: input.position } });
  else await prisma.navigationItem.create({ data: { menu: input.menu, label: input.label, url: input.url, position: input.position } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteNavItemAction(id: string) {
  await assertStaff();
  await prisma.navigationItem.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/content");
  return { ok: true };
}

/* ---------------- Customers ---------------- */
export async function updateCustomerNoteAction(id: string, note: string) {
  await assertStaff();
  await prisma.user.update({ where: { id }, data: { note } });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true };
}
