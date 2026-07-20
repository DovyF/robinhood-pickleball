import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard, type CardProduct } from "@/components/product/ProductCard";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) return null;
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: { images: { orderBy: { position: "asc" }, take: 2 }, variants: { take: 1, orderBy: { position: "asc" } } } },
    },
  });

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-panel p-10 text-center shadow-card">
        <h2 className="text-lg font-bold">Your wishlist is empty</h2>
        <p className="mt-1 text-ink-soft">Tap the heart on any product to save it here.</p>
        <Link href="/products" className="btn btn-primary mt-4">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
      {items.map((it) => (
        <ProductCard key={it.id} product={it.product as unknown as CardProduct} />
      ))}
    </div>
  );
}
