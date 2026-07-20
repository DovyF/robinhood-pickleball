"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toggleWishlistAction, isWishlistedAction } from "@/app/actions/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const [active, setActive] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    isWishlistedAction(productId).then((v) => mounted && setActive(v));
    return () => {
      mounted = false;
    };
  }, [productId]);

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActive((v) => !v);
    startTransition(async () => {
      const res = await toggleWishlistAction(productId);
      if (typeof res.active === "boolean") setActive(res.active);
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-panel/90 backdrop-blur shadow-card transition hover:scale-110",
        className
      )}
    >
      <Heart size={17} className={cn("transition", active ? "fill-red-500 text-red-500" : "text-ink-soft")} />
    </button>
  );
}
