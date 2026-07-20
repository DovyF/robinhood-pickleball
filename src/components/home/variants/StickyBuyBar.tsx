"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky buy-bar — appears after the visitor scrolls past the hero, keeping the
 * primary CTA one tap away on a long single-product page. Proven conversion lift.
 */
export function StickyBuyBar({ image, href, unitsLeft }: { image: string; href: string; unitsLeft: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#2e2e2e] bg-[#0d0d0d]/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="container-x flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-11 w-11 rounded-lg object-cover" />
          <div>
            <p className="font-display text-lg leading-none tracking-wide text-white">The Longbow</p>
            <p className="text-sm text-forest-700">$99.99 <span className="text-ink-soft">· only {unitsLeft} left</span></p>
          </div>
        </div>
        <Link href={href} className="btn btn-primary">Add to cart</Link>
      </div>
    </div>
  );
}
