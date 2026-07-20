"use server";

import { prisma } from "@/lib/prisma";

export async function subscribeNewsletterAction(email: string) {
  const normalized = email.toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) return { ok: false, error: "Invalid email" };
  try {
    await prisma.user.upsert({
      where: { email: normalized },
      update: { marketingOptIn: true },
      create: { email: normalized, marketingOptIn: true, role: "customer" },
    });
  } catch {
    // ignore duplicates / races
  }
  return { ok: true };
}
