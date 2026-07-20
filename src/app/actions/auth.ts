"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendPasswordReset, sendEmailVerification } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerAction(raw: unknown) {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { firstName, lastName, email, password } = parsed.data;
  const normalized = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing?.passwordHash) return { ok: false, error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: normalized },
    update: { firstName, lastName, name: `${firstName} ${lastName}`, passwordHash },
    create: { email: normalized, firstName, lastName, name: `${firstName} ${lastName}`, passwordHash, role: "customer" },
  });

  // Email verification (best-effort)
  const token = nanoid(40);
  await prisma.token.create({ data: { email: normalized, token, type: "email_verify", expires: new Date(Date.now() + 86400000) } });
  await sendEmailVerification(normalized, absoluteUrl(`/account/verify?token=${token}`)).catch(() => {});

  return { ok: true };
}

export async function requestPasswordResetAction(email: string) {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  // Always return ok to avoid account enumeration
  if (user) {
    const token = nanoid(40);
    await prisma.token.create({ data: { email: normalized, token, type: "password_reset", expires: new Date(Date.now() + 3600000) } });
    await sendPasswordReset(normalized, absoluteUrl(`/account/reset?token=${token}`)).catch(() => {});
  }
  return { ok: true };
}

const resetSchema = z.object({ token: z.string(), password: z.string().min(8) });

export async function resetPasswordAction(raw: unknown) {
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Password must be at least 8 characters." };
  const { token, password } = parsed.data;
  const record = await prisma.token.findUnique({ where: { token } });
  if (!record || record.type !== "password_reset" || record.expires < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { email: record.email }, data: { passwordHash } });
  await prisma.token.delete({ where: { token } }).catch(() => {});
  return { ok: true };
}

export async function verifyEmailAction(token: string) {
  const record = await prisma.token.findUnique({ where: { token } });
  if (!record || record.type !== "email_verify" || record.expires < new Date()) return { ok: false };
  await prisma.user.update({ where: { email: record.email }, data: { emailVerified: new Date() } });
  await prisma.token.delete({ where: { token } }).catch(() => {});
  return { ok: true };
}
