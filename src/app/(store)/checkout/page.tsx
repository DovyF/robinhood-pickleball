import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCartView } from "@/lib/cart";
import { auth } from "@/lib/auth";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const cart = await getCartView();
  if (!cart || cart.lines.length === 0) redirect("/cart");
  const session = await auth();

  return (
    <div className="min-h-screen">
      <CheckoutClient
        cart={cart}
        defaultEmail={session?.user?.email ?? ""}
        stripeKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
      />
    </div>
  );
}
