"use client";

import { useEffect } from "react";
import type { CartView } from "@/lib/cart";
import { useCartUI } from "@/store/cart-ui";
import { CartDrawer } from "@/components/cart/CartDrawer";

/** Seeds the client cart store with the server-rendered cart and mounts the drawer. */
export function CartProvider({ initialCart }: { initialCart: CartView | null }) {
  const setCart = useCartUI((s) => s.setCart);
  useEffect(() => {
    setCart(initialCart);
  }, [initialCart, setCart]);
  return <CartDrawer />;
}
