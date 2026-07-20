"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { useTransition } from "react";
import { useCartUI } from "@/store/cart-ui";
import { updateLineAction, removeLineAction } from "@/app/actions/cart";
import { formatMoney } from "@/lib/utils";

export function CartDrawer() {
  const { open, cart, closeCart, setCart } = useCartUI();
  const [pending, startTransition] = useTransition();

  function update(lineId: string, qty: number) {
    startTransition(async () => setCart(await updateLineAction(lineId, qty)));
  }
  function remove(lineId: string) {
    startTransition(async () => setCart(await removeLineAction(lineId)));
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-cream-dark px-5 py-4">
          <h2 className="text-lg font-bold">Your cart {cart?.itemCount ? `(${cart.itemCount})` : ""}</h2>
          <button onClick={closeCart} aria-label="Close cart" className="btn btn-ghost !p-2">
            <X size={20} />
          </button>
        </header>


        {/* Lines */}
        <div className="flex-1 overflow-y-auto px-5">
          {!cart || cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag size={48} className="text-ink-soft/30" />
              <p className="text-ink-soft">Your cart is empty.</p>
              <button onClick={closeCart} className="btn btn-primary">
                Start shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-cream-dark">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-4">
                  <Link href={`/products/${line.slug}`} onClick={closeCart} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-panel">
                    {line.imageUrl && <Image src={line.imageUrl} alt={line.title} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link href={`/products/${line.slug}`} onClick={closeCart} className="text-sm font-semibold leading-snug">
                        {line.title}
                      </Link>
                      <button onClick={() => remove(line.id)} aria-label="Remove" className="text-ink-soft hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {line.variantTitle && <span className="text-xs text-ink-soft">{line.variantTitle}</span>}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-cream-dark">
                        <button onClick={() => update(line.id, line.quantity - 1)} className="grid h-8 w-8 place-items-center" aria-label="Decrease">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                        <button
                          onClick={() => update(line.id, line.quantity + 1)}
                          disabled={line.quantity >= line.maxQty}
                          className="grid h-8 w-8 place-items-center disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{formatMoney(line.lineTotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart && cart.lines.length > 0 && (
          <footer className="border-t border-cream-dark bg-panel px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span className="text-lg font-bold">{formatMoney(cart.subtotal)}</span>
            </div>
            <p className="mb-3 text-xs text-ink-soft">Shipping &amp; taxes calculated at checkout.</p>
            <div className="flex gap-2">
              <Link href="/cart" onClick={closeCart} className="btn btn-outline flex-1">
                View cart
              </Link>
              <Link href="/checkout" onClick={closeCart} className="btn btn-primary flex-1">
                {pending ? <Loader2 className="animate-spin" size={18} /> : "Checkout"}
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
