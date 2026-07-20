import type { Metadata } from "next";
import Link from "next/link";
import { getCartView } from "@/lib/cart";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

export default async function CartPage() {
  const cart = await getCartView();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container-x flex flex-col items-center py-24 text-center">
        <h1 className="text-3xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-ink-soft">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="btn btn-primary mt-6">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-3xl font-extrabold">Your Cart</h1>
      <CartPageClient initialCart={cart} />
    </div>
  );
}
