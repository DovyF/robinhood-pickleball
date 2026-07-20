"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  productId: z.string(),
  slug: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(4).max(2000),
  authorName: z.string().min(1).max(80),
  authorEmail: z.string().email().optional(),
});

export async function submitReviewAction(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please complete all fields." };
  const data = parsed.data;
  const session = await auth();

  // Verified buyer check
  const purchased = session?.user?.id
    ? await prisma.orderItem.findFirst({
        where: { productId: data.productId, order: { userId: session.user.id, paymentStatus: "paid" } },
      })
    : null;

  await prisma.review.create({
    data: {
      productId: data.productId,
      userId: session?.user?.id,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      rating: data.rating,
      title: data.title,
      body: data.body,
      status: "published",
      verified: !!purchased,
    },
  });

  await recomputeProductRating(data.productId);
  revalidatePath(`/products/${data.slug}`);
  return { ok: true };
}

export async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "published" },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
  });
}
