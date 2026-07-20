"use client";

import { ShoppingBag } from "lucide-react";
import { useCartUI } from "@/store/cart-ui";

export function CartButton() {
  const { cart, openCart } = useCartUI();
  const count = cart?.itemCount ?? 0;
  return (
    <button onClick={openCart} aria-label="Open cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark transition">
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-forest-700 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
