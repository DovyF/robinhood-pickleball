import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { StarRating } from "@/components/ui/StarRating";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";

export interface CardProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  productType?: string | null;
  images: { url: string; altText?: string | null }[];
  variants?: { id: string; inventoryQty: number; trackInventory: boolean }[];
}

export function ProductCard({ product, priority = false }: { product: CardProduct; priority?: boolean }) {
  const img = product.images[0]?.url;
  const hoverImg = product.images[1]?.url;
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const soldOut =
    product.variants && product.variants.length > 0
      ? product.variants.every((v) => v.trackInventory && v.inventoryQty <= 0)
      : false;
  const singleVariant = product.variants?.length === 1 ? product.variants[0].id : null;
  const savings = onSale ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0;

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-panel shadow-card">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          {img ? (
            <>
              <Image
                src={img}
                alt={product.images[0]?.altText || product.title}
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                priority={priority}
                className="object-cover transition-opacity duration-500 group-hover:opacity-0"
              />
              {hoverImg && (
                <Image
                  src={hoverImg}
                  alt=""
                  fill
                  sizes="(max-width:640px) 50vw, 25vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">No image</div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && !soldOut && (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-xs font-bold text-forest-900">Save {savings}%</span>
          )}
          {soldOut && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Sold out</span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} />
        </div>

        {/* Quick add */}
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {singleVariant ? (
            <AddToCartButton productId={product.id} variantId={singleVariant} disabled={soldOut} compact label="Quick add" />
          ) : (
            <Link href={`/products/${product.slug}`} className="btn btn-primary w-full !py-2 text-sm">
              Choose options
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {product.productType && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">{product.productType}</span>
        )}
        <Link href={`/products/${product.slug}`} className="font-semibold leading-snug link-underline w-fit">
          {product.title}
        </Link>
        {product.reviewCount > 0 && <StarRating rating={product.rating} count={product.reviewCount} />}
        <Price amount={product.price} compareAt={product.compareAtPrice} className="mt-0.5" />
      </div>
    </div>
  );
}
