"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Lock, Truck, ShieldCheck, Heart, ChevronLeft } from "lucide-react";
import type { CartView } from "@/lib/cart";
import type { CheckoutAddress } from "@/lib/orders";
import type { ShippingRate } from "@/lib/shipping";
import { Logo } from "@/components/layout/Logo";
import { US_STATES } from "@/lib/us-states";
import { formatMoney, cn } from "@/lib/utils";
import { quoteCheckoutAction, totalsForRateAction, placeOrderAction } from "@/app/actions/checkout";
import { StripePayment } from "@/components/checkout/StripePayment";

type Totals = { subtotal: number; discountTotal: number; shippingTotal: number; taxTotal: number; total: number };

const empty: CheckoutAddress = { firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "US", phone: "" };

export function CheckoutClient({ cart, defaultEmail, stripeKey }: { cart: CartView; defaultEmail: string; stripeKey: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [addr, setAddr] = useState<CheckoutAddress>(empty);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [rate, setRate] = useState<ShippingRate | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<{ orderId: string; orderNumber: number; clientSecret: string | null } | null>(null);

  const canQuote = email && addr.firstName && addr.lastName && addr.line1 && addr.city && addr.state && addr.postalCode;

  function fld(k: keyof CheckoutAddress, v: string) {
    setAddr((a) => ({ ...a, [k]: v }));
  }

  function continueToShipping(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const q = await quoteCheckoutAction({ cartToken: cart.token, address: addr, discountCode: cart.discountCode });
      setRates(q.rates);
      const first = q.rates[0] ?? null;
      setRate(first);
      if (first) {
        const t = await totalsForRateAction({ cartToken: cart.token, address: addr, shippingAmount: first.amount, discountCode: cart.discountCode });
        setTotals(t);
      }
      setStep(2);
    });
  }

  function chooseRate(r: ShippingRate) {
    setRate(r);
    startTransition(async () => {
      const t = await totalsForRateAction({ cartToken: cart.token, address: addr, shippingAmount: r.amount, discountCode: cart.discountCode });
      setTotals(t);
    });
  }

  function placeOrder() {
    if (!rate) return;
    setError("");
    startTransition(async () => {
      const res = await placeOrderAction({
        cartToken: cart.token,
        email,
        phone: addr.phone,
        shippingAddress: addr,
        shippingRateId: rate.id,
        shippingAmount: rate.amount,
        shippingLabel: rate.label,
        shippingCarrier: rate.carrier,
        discountCode: cart.discountCode,
      });
      if (!res.ok) return setError(res.error);
      if (res.demo || !res.clientSecret) {
        router.push(`/checkout/success?order=${res.orderId}`);
      } else {
        setPayment({ orderId: res.orderId, orderNumber: res.orderNumber, clientSecret: res.clientSecret });
      }
    });
  }

  const runningTotal = totals ? totals.total : Math.max(0, cart.subtotal - cart.discountTotal);

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1fr_440px]">
      {/* Left: form */}
      <div className="px-4 py-8 sm:px-10 lg:py-14">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft"><Lock size={13} className="text-forest-700" /> Secure checkout</span>
        </div>

        {/* Step indicator */}
        <ol className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
          <li className={cn("flex items-center gap-2", step === 1 ? "text-forest-700" : "text-ink-soft")}>
            <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[11px]", step === 1 ? "bg-forest-700 text-[#0d0d0d]" : "bg-panel text-ink-soft")}>1</span> Address
          </li>
          <span className="h-px w-8 bg-cream-dark" />
          <li className={cn("flex items-center gap-2", step === 2 ? "text-forest-700" : "text-ink-soft")}>
            <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[11px]", step === 2 ? "bg-forest-700 text-[#0d0d0d]" : "bg-panel text-ink-soft")}>2</span> Shipping &amp; payment
          </li>
        </ol>

        {/* Step 1: Contact + Address */}
        {step === 1 && (
          <form onSubmit={continueToShipping} className="space-y-7">
            <section>
              <h2 className="mb-3 font-display text-2xl tracking-wide text-white">Contact</h2>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="input" />
              <p className="mt-2 text-xs text-ink-soft">Order confirmation and tracking go here.</p>
            </section>
            <section>
              <h2 className="mb-3 font-display text-2xl tracking-wide text-white">Shipping address</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input required placeholder="First name" value={addr.firstName} onChange={(e) => fld("firstName", e.target.value)} className="input" />
                <input required placeholder="Last name" value={addr.lastName} onChange={(e) => fld("lastName", e.target.value)} className="input" />
              </div>
              <input required placeholder="Address" value={addr.line1} onChange={(e) => fld("line1", e.target.value)} className="input mt-3" />
              <input placeholder="Apartment, suite, etc. (optional)" value={addr.line2} onChange={(e) => fld("line2", e.target.value)} className="input mt-3" />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input required placeholder="City" value={addr.city} onChange={(e) => fld("city", e.target.value)} className="input" />
                <select required value={addr.state} onChange={(e) => fld("state", e.target.value)} className="input">
                  <option value="">State</option>
                  {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                <input required placeholder="ZIP code" value={addr.postalCode} onChange={(e) => fld("postalCode", e.target.value)} className="input" />
              </div>
              <input placeholder="Phone (optional)" value={addr.phone} onChange={(e) => fld("phone", e.target.value)} className="input mt-3" />
            </section>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={!canQuote || pending} className="btn btn-primary w-full disabled:opacity-50">
              {pending ? <Loader2 className="animate-spin" size={18} /> : "Continue to shipping"}
            </button>
          </form>
        )}

        {/* Step 2: Shipping method + payment */}
        {step === 2 && (
          <div className="space-y-6">
            <button onClick={() => { setStep(1); setPayment(null); }} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-white">
              <ChevronLeft size={15} /> Back to address
            </button>

            <section className="rounded-xl border border-cream-dark bg-panel px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Ship to</span>
                <span className="text-right font-medium text-white">{addr.line1}, {addr.city}, {addr.state} {addr.postalCode}</span>
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-display text-2xl tracking-wide text-white">Shipping method</h2>
              {rates.length === 0 ? (
                <p className="rounded-xl border border-cream-dark bg-panel px-4 py-3 text-sm text-ink-soft">Enter a valid address to see live USPS rates.</p>
              ) : (
                <div className="space-y-2">
                  {rates.map((r) => (
                    <label key={r.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border bg-panel px-4 py-3 transition", rate?.id === r.id ? "border-forest-700 ring-1 ring-forest-700" : "border-cream-dark hover:border-white/25")}>
                      <input type="radio" name="rate" checked={rate?.id === r.id} onChange={() => chooseRate(r)} className="accent-forest-700" />
                      <Truck size={18} className="text-forest-700" />
                      <span className="flex-1 text-sm font-medium text-white">{r.label}</span>
                      <span className="font-semibold text-white">{r.amount === 0 ? "Free" : formatMoney(r.amount)}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-2xl tracking-wide text-white">Payment</h2>
              {payment && payment.clientSecret && stripeKey ? (
                <StripePayment publishableKey={stripeKey} clientSecret={payment.clientSecret} orderId={payment.orderId} email={email} />
              ) : (
                <div className="rounded-xl border border-cream-dark bg-panel p-4">
                  {!stripeKey && (
                    <p className="mb-3 rounded-lg border border-forest-700/30 bg-forest-700/10 px-3 py-2 text-xs text-forest-700">
                      Demo mode: Stripe keys not configured yet. Placing an order completes the full flow without a real charge.
                    </p>
                  )}
                  {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
                  <button onClick={placeOrder} disabled={pending || !rate} className="btn btn-primary w-full disabled:opacity-50">
                    {pending ? <Loader2 className="animate-spin" size={18} /> : <><Lock size={16} /> Place order · {formatMoney(runningTotal)}</>}
                  </button>
                  <p className="mt-3 text-center text-xs text-ink-soft">You won&apos;t be charged until you confirm on the next step.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Right: order summary */}
      <aside className="order-first bg-[#0d0d0d] px-4 py-8 sm:px-8 lg:order-last lg:border-l lg:border-cream-dark lg:py-14">
        <ul className="space-y-4">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                {line.imageUrl && <Image src={line.imageUrl} alt={line.title} fill sizes="64px" className="object-contain p-1" />}
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-forest-700 px-1 text-[11px] font-bold text-[#0d0d0d]">{line.quantity}</span>
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-white">{line.title}</p>
                {line.variantTitle && <p className="text-ink-soft">{line.variantTitle}</p>}
              </div>
              <span className="text-sm font-semibold text-white">{formatMoney(line.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2.5 border-t border-cream-dark pt-6 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="text-white">{formatMoney(cart.subtotal)}</dd></div>
          {cart.discountTotal > 0 && <div className="flex justify-between text-forest-700"><dt>Discount</dt><dd>−{formatMoney(cart.discountTotal)}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="text-white">{totals ? (totals.shippingTotal === 0 ? "Free" : formatMoney(totals.shippingTotal)) : "Calculated next"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="text-white">{totals ? formatMoney(totals.taxTotal) : "—"}</dd></div>
          <div className="flex justify-between border-t border-cream-dark pt-3 text-lg font-bold">
            <dt className="text-white">Total</dt><dd className="text-white">{formatMoney(runningTotal)}</dd>
          </div>
        </dl>

        {/* Trust block — honest reassurance right where doubt peaks */}
        <div className="mt-8 space-y-3 rounded-2xl border border-white/5 bg-panel p-4 text-sm">
          <div className="flex items-center gap-2.5 text-ink-soft"><Lock size={16} className="shrink-0 text-forest-700" /> Secure checkout, powered by Stripe</div>
          <div className="flex items-center gap-2.5 text-ink-soft"><ShieldCheck size={16} className="shrink-0 text-forest-700" /> 21-day money-back guarantee</div>
          <div className="flex items-center gap-2.5 text-ink-soft"><Heart size={16} className="shrink-0 text-forest-700" /> 10% of your order is donated to those in need</div>
        </div>

        <Link href="/cart" className="mt-4 inline-flex items-center gap-1 text-xs text-ink-soft hover:text-white"><ChevronLeft size={13} /> Return to cart</Link>
      </aside>
    </div>
  );
}
