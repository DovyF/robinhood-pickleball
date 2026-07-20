"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Tag, X, Loader2 } from "lucide-react";
import type { CartView } from "@/lib/cart";
import { updateLineAction, removeLineAction, applyDiscountAction, removeDiscountAction } from "@/app/actions/cart";
import { useCartUI } from "@/store/cart-ui";
import { formatMoney } from "@/lib/utils";

export function CartPageClient({ initialCart }: { initialCart: CartView }) {
  const [cart, setLocal] = useState<CartView>(initialCart);
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const setGlobal = useCartUI((s) => s.setCart);

  useEffect(() => {
    setGlobal(cart);
  }, [cart, setGlobal]);

  function update(id: string, qty: number) {
    startTransition(async () => setLocal(await updateLineAction(id, qty)));
  }
  function remove(id: string) {
    startTransition(async () => setLocal(await removeLineAction(id)));
  }
  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    startTransition(async () => {
      const res = await applyDiscountAction(code);
      if (!res.ok) setCodeError(res.error ?? "Invalid code");
      else setCode("");
    });
  }


  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      {/* Lines */}
      <div>
        <ul className="divide-y divide-cream-dark border-y border-cream-dark">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-5">
              <Link href={`/products/${line.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-panel">
                {line.imageUrl && <Image src={line.imageUrl} alt={line.title} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link href={`/products/${line.slug}`} className="font-semibold">{line.title}</Link>
                    {line.variantTitle && <p className="text-sm text-ink-soft">{line.variantTitle}</p>}
                  </div>
                  <span className="font-semibold">{formatMoney(line.lineTotal)}</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-full border border-cream-dark bg-panel">
                    <button onClick={() => update(line.id, line.quantity - 1)} className="grid h-9 w-9 place-items-center" aria-label="Decrease">
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                    <button onClick={() => update(line.id, line.quantity + 1)} disabled={line.quantity >= line.maxQty} className="grid h-9 w-9 place-items-center disabled:opacity-30" aria-label="Increase">
                      <Plus size={15} />
                    </button>
                  </div>
                  <button onClick={() => remove(line.id)} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-red-500">
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/products" className="mt-6 inline-block text-sm font-semibold text-forest-700 link-underline">← Continue shopping</Link>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-2xl bg-panel p-6 shadow-card lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Order Summary</h2>

        {/* Discount */}
        <div className="mt-4">
          {cart.discountCode ? (
            <div className="flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-forest-700">
                <Tag size={15} /> {cart.discountCode}
              </span>
              <button onClick={() => startTransition(async () => setLocal(await removeDiscountAction().then(() => ({ ...cart, discountCode: null }))))} aria-label="Remove code">
                <X size={16} className="text-ink-soft hover:text-red-500" />
              </button>
            </div>
          ) : (
            <form onSubmit={applyCode} className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Discount code" className="flex-1 rounded-lg border border-cream-dark bg-panel px-3 py-2 text-sm outline-none focus:border-forest-500" />
              <button type="submit" disabled={pending || !code} className="btn btn-outline !py-2 text-sm disabled:opacity-50">Apply</button>
            </form>
          )}
          {codeError && <p className="mt-1 text-xs text-red-600">{codeError}</p>}
        </div>

        <dl className="mt-5 space-y-2.5 border-t border-cream-dark pt-5 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-medium">{formatMoney(cart.subtotal)}</dd></div>
          {cart.discountTotal > 0 && (
            <div className="flex justify-between text-forest-600"><dt>Discount</dt><dd>−{formatMoney(cart.discountTotal)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="text-ink-soft">Calculated at checkout</dd></div>
          <div className="flex justify-between border-t border-cream-dark pt-3 text-base font-bold">
            <dt>Estimated total</dt><dd>{formatMoney(Math.max(0, cart.subtotal - cart.discountTotal))}</dd>
          </div>
        </dl>


        <Link href="/checkout" className="btn btn-primary mt-5 w-full">
          {pending ? <Loader2 className="animate-spin" size={18} /> : "Checkout"}
        </Link>
        <p className="mt-3 text-center text-xs text-ink-soft">Secure checkout · Powered by Stripe</p>
      </aside>
    </div>
  );
}
