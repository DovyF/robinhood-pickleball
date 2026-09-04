"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { captureShabbosHolds } from "@/lib/orders";
import { normalizeWeekOf, getShabbosWindow } from "@/lib/shabbos";

export async function saveShabbosSettingsAction(input: { zip: string; havdalahMinutes: number; enabled: boolean }) {
  await assertStaff();
  await prisma.setting.upsert({ where: { key: "shabbos_zip" }, update: { value: input.zip }, create: { key: "shabbos_zip", value: input.zip } });
  await prisma.setting.upsert({
    where: { key: "shabbos_havdalah_minutes" },
    update: { value: String(input.havdalahMinutes) },
    create: { key: "shabbos_havdalah_minutes", value: String(input.havdalahMinutes) },
  });
  await prisma.setting.upsert({
    where: { key: "shabbos_enabled" },
    update: { value: String(input.enabled) },
    create: { key: "shabbos_enabled", value: String(input.enabled) },
  });
  await logAudit("shabbos.settings.save", "setting");
  revalidatePath("/admin/shabbos");
  return { ok: true };
}

export async function saveShabbosOverrideAction(input: { weekOf: string; startsAt?: string | null; endsAt?: string | null; zip?: string | null; note?: string | null }) {
  await assertStaff();
  const weekOf = normalizeWeekOf(new Date(input.weekOf));
  await prisma.shabbosOverride.upsert({
    where: { weekOf },
    update: {
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      zip: input.zip || null,
      note: input.note || null,
    },
    create: {
      weekOf,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      zip: input.zip || null,
      note: input.note || null,
    },
  });
  await logAudit("shabbos.override.save", "shabbosOverride", weekOf.toISOString());
  revalidatePath("/admin/shabbos");
  return { ok: true };
}

export async function deleteShabbosOverrideAction(id: string) {
  await assertStaff();
  await prisma.shabbosOverride.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/shabbos");
  return { ok: true };
}

export async function captureShabbosHoldsNowAction() {
  await assertStaff();
  const result = await captureShabbosHolds();
  await logAudit("shabbos.capture.manual", "order", undefined, `captured ${result.captured}/${result.checked}`);
  revalidatePath("/admin/shabbos");
  revalidatePath("/admin/orders");
  return result;
}

export async function previewShabbosWindowAction(dateIso: string) {
  await assertStaff();
  const window = await getShabbosWindow(new Date(dateIso));
  return { start: window.start.toISOString(), end: window.end.toISOString() };
}
