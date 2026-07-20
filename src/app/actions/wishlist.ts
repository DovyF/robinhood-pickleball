"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function isWishlistedAction(productId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const row = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });
  return !!row;
}

export async function toggleWishlistAction(productId: string): Promise<{ active?: boolean; needsAuth?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { needsAuth: true };
  const userId = session.user.id;
  const existing = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { active: false };
  }
  await prisma.wishlistItem.create({ data: { userId, productId } });
  return { active: true };
}
