"use server";

import { prisma } from "@/lib/prisma";
import { sendNewsletterWelcome } from "@/lib/email";

export async function subscribeNewsletterAction(email: string) {
  const normalized = email.toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) return { ok: false, error: "Invalid email" };
  try {
    const user = await prisma.user.upsert({
      where: { email: normalized },
      update: { marketingOptIn: true },
      create: { email: normalized, marketingOptIn: true, role: "customer" },
    });
    // Send welcome email (fire-and-forget, don't block on it)
    sendNewsletterWelcome(normalized).catch(() => {});
  } catch {
    // ignore duplicates / races
  }
  return { ok: true };
}
