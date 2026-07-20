"use client";

import { useTransition } from "react";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { useCartUI } from "@/store/cart-ui";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  disabled,
  className,
  label = "Add to cart",
  openDrawer = true,
  compact = false,
}: {
  productId: string;
  variantId: string | null;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  openDrawer?: boolean;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const { setCart, openCart } = useCartUI();

  function handleClick() {
    startTransition(async () => {
      const cart = await addToCartAction(productId, variantId, quantity);
      setCart(cart);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      if (openDrawer) openCart();
      // notify pixels
      if (typeof window !== "undefined") {
        (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "AddToCart");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      className={cn("btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed", compact && "!px-4 !py-2 text-sm", className)}
    >
      {pending ? (
        <Loader2 className="animate-spin" size={18} />
      ) : done ? (
        <Check size={18} />
      ) : (
        <ShoppingBag size={compact ? 16 : 18} />
      )}
      {disabled ? "Sold out" : done ? "Added!" : label}
    </button>
  );
}
