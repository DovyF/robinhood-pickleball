"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Heart, ShieldCheck, RotateCcw, Minus, Plus, Check, Truck, Lock, Sparkles } from "lucide-react";
import { Price } from "@/components/ui/Price";
import { StarRating } from "@/components/ui/StarRating";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { parseList, cn } from "@/lib/utils";

interface Variant {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  option1: string | null;
  inventoryQty: number;
  trackInventory: boolean;
}
interface Option {
  name: string;
  values: string;
}
interface ProductViewProps {
  product: {
    id: string;
    title: string;
    productType: string | null;
    descriptionHtml: string;
    rating: number;
    reviewCount: number;
    price: number;
    compareAtPrice: number | null;
    images: { url: string; altText: string | null }[];
    variants: Variant[];
    options: Option[];
  };
}

// Product-specific selling points (single-product store).
const BENEFITS = [
  "Gritty carbon face for heavy, controllable spin",
  "Notched foam core = bigger sweet spot, more pop",
  "Elongated shape for reach and fast hands",
];

const FEATHER = {
  WebkitMaskImage: "radial-gradient(ellipse 78% 78% at 50% 48%, #000 60%, transparent 100%)",
  maskImage: "radial-gradient(ellipse 78% 78% at 50% 48%, #000 60%, transparent 100%)",
} as const;

export function ProductView({ product }: ProductViewProps) {
  const hasVariants = product.variants.length > 1;
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const selected = useMemo(
    () => product.variants.find((v) => v.id === selectedId) ?? product.variants[0],
    [selectedId, product.variants]
  );

  const price = selected?.price ?? product.price;
  const compareAt = selected?.compareAtPrice ?? product.compareAtPrice;
  const tracked = selected?.trackInventory;
  const stock = selected?.inventoryQty ?? 0;
  const soldOut = tracked ? stock <= 0 : false;

  const optionValues = product.options[0] ? parseList(product.options[0].values) : [];

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          {product.images.length > 1 && (
            <div className="flex gap-3 md:flex-col">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black ring-1 transition md:h-20 md:w-20",
                    activeImg === i ? "ring-forest-700" : "ring-white/10 hover:ring-white/25"
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-700/15 blur-[90px]" />
            {product.images[activeImg] && (
              <Image
                src={product.images[activeImg].url}
                alt={product.images[activeImg].altText || product.title}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-contain p-6"
                style={FEATHER}
              />
            )}
            <div className="absolute right-4 top-4">
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </div>

        {/* Buy box */}
        <div>
          {product.productType && (
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-700">{product.productType}</span>
          )}
          <h1 className="mt-2 font-display text-5xl tracking-wide text-white sm:text-6xl">{product.title}</h1>

          {product.reviewCount > 0 && (
            <div className="mt-3">
              <StarRating rating={product.rating} count={product.reviewCount} size={16} />
            </div>
          )}

          <div className="mt-5 flex items-center gap-4">
            <Price amount={price} compareAt={compareAt} size="lg" />
            {tracked && stock > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-700/40 bg-forest-700/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-forest-700">
                <Sparkles size={12} /> Only {stock} left
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Comparable big-brand paddles cost <span className="text-ink-soft line-through">$250</span> — same build, none of the markup.
          </p>

          {/* Benefit bullets — value above the fold */}
          <ul className="mt-6 space-y-2.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[15px] text-ink">
                <Check size={18} className="mt-0.5 shrink-0 text-forest-700" /> {b}
              </li>
            ))}
          </ul>

          {/* Options */}
          {hasVariants && (
            <div className="mt-6">
              <span className="text-sm font-semibold text-white">{product.options[0]?.name ?? "Options"}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const vSoldOut = v.trackInventory && v.inventoryQty <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        v.id === selectedId ? "border-forest-700 bg-forest-700 text-[#0d0d0d]" : "border-white/15 bg-panel text-white hover:border-forest-700/60",
                        vSoldOut && "opacity-40 line-through"
                      )}
                    >
                      {v.option1 || v.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + add */}
          <div className="mt-7 flex items-stretch gap-3">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-panel">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center text-white" aria-label="Decrease quantity">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold text-white">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-12 w-12 place-items-center text-white" aria-label="Increase quantity">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1">
              <AddToCartButton productId={product.id} variantId={selected?.id ?? null} quantity={qty} disabled={soldOut} label={soldOut ? "Sold out" : "Add to cart"} />
            </div>
          </div>

          {/* Reassurance line */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-forest-700" /> Secure checkout</span>
            <span className="inline-flex items-center gap-1.5"><Truck size={13} className="text-forest-700" /> Ships from the US via USPS</span>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-panel p-4">
            {[
              { icon: RotateCcw, label: "21-day money-back" },
              { icon: ShieldCheck, label: "6-month warranty" },
              { icon: Heart, label: "10% to charity" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon size={20} className="text-forest-700" />
                <span className="text-xs font-medium text-ink-soft">{label}</span>
              </div>
            ))}
          </div>

          {/* USAPA honesty note — kills the top objection right in the buy box */}
          <details className="group mt-4 rounded-2xl border border-white/5 bg-panel p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white">
              Is it USAPA-approved?
              <span className="text-forest-700 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              It&apos;s built to tournament spec, and official USAPA certification is in progress. For rec play, drills, and casual leagues you&apos;re good to go today. For sanctioned tournaments, certification is on the way — and this first batch is priced accordingly.
            </p>
          </details>

          {/* Description */}
          <div className="prose prose-sm prose-invert mt-8 max-w-none whitespace-pre-line text-ink-soft [&_h2]:text-white [&_h3]:text-white" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        </div>
      </div>

      {/* Mobile sticky add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d0d0d]/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="font-display text-lg leading-none tracking-wide text-white">{product.title}</p>
            <p className="text-sm text-forest-700">${price.toFixed(2)}</p>
          </div>
          <div className="flex-1">
            <AddToCartButton productId={product.id} variantId={selected?.id ?? null} quantity={qty} disabled={soldOut} label={soldOut ? "Sold out" : "Add"} />
          </div>
        </div>
      </div>
    </>
  );
}
