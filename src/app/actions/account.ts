"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().default("US"),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function addAddressAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please complete all fields." };

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  await prisma.address.create({ data: { ...parsed.data, userId: session.user.id } });
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddressAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddressAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  await prisma.address.updateMany({ where: { id, userId: session.user.id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
  return { ok: true };
}
