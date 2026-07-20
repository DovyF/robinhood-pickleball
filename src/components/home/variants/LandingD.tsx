import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { IMG, PRICE, FEATURES, STATS, PRODUCT_HREF } from "./longbow-data";
import { PreviewSwitcher } from "./PreviewSwitcher";

/**
 * Variant D — "Cinematic" (original full-redesign draft).
 * Keeps the iconic hero overlay, adds editorial stat band, alternating photo
 * spreads, a value band, and a sticky buy-bar.
 */
export function LandingD() {
  return (
    <div className="bg-[#0a0a0a]">
      {/* Cinematic hero */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.heroBg} alt="" className="animate-paddle-ambient absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center 65%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.heroOverlay} alt="Built for Battles. Made to Win." className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        <div className="container-x relative z-10 pb-16">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.3em] text-forest-700">The Longbow · Now Shipping</span>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-md text-lg text-ink-soft">A tournament-grade paddle at a fraction of the price. Explosive power, forgiving touch.</p>
            <div className="flex items-center gap-4">
              <span className="font-display text-4xl text-white">{PRICE.sale}</span>
              <Link href={PRODUCT_HREF} className="btn btn-primary text-sm">Shop the Longbow <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial stat band */}
      <section className="border-y border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="container-x grid grid-cols-2 gap-y-10 py-14 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-6xl leading-none text-white">{s.n}<span className="ml-1 text-2xl text-forest-700">{s.u}</span></p>
              <p className="mt-2 text-xs uppercase tracking-widest text-ink-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alternating feature spreads */}
      {FEATURES.map((f, i) => {
        const photo = [IMG.face, IMG.grip, IMG.throat][i];
        const reverse = i % 2 === 1;
        return (
          <section key={f.h} className="container-x py-20">
            <div className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${reverse ? "md:[direction:rtl]" : ""}`}>
              <div className="overflow-hidden rounded-2xl bg-[#111] [direction:ltr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="[direction:ltr]">
                <span className="font-display text-7xl text-[#1e1e1e]">0{i + 1}</span>
                <h2 className="-mt-4 font-display text-4xl tracking-wide text-white sm:text-5xl">{f.h}</h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">{f.d}</p>
              </div>
            </div>
          </section>
        );
      })}

      {/* Value proposition band */}
      <section className="relative overflow-hidden border-y border-[#1e1e1e] bg-gradient-to-br from-[#12200a] via-[#0d0d0d] to-[#0d0d0d]">
        <div className="container-x py-20 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-5xl leading-tight text-white sm:text-6xl">
            Why pay <span className="text-ink-soft line-through decoration-forest-700 decoration-4">$250</span> when <span className="text-forest-700">$99.99</span> plays better?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">We cut the markup, not the materials. The same carbon-fiber build the pros pay double for — and 10% of every sale goes to those in need.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {["21-day money-back guarantee", "Secure checkout", "10% donated to charity"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-[#2e2e2e] px-4 py-2 text-sm text-ink-soft">
                <Check size={15} className="text-forest-700" /> {t}
              </span>
            ))}
          </div>
          <Link href={PRODUCT_HREF} className="btn btn-primary mt-10 text-base">Get the Longbow — {PRICE.sale} <ArrowRight size={18} /></Link>
        </div>
      </section>

      {/* Sticky buy bar */}
      <div className="sticky bottom-20 z-30 mx-auto w-[min(92%,640px)] rounded-full border border-[#2e2e2e] bg-[#141414]/90 px-5 py-3 shadow-lift backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.face} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="font-display text-lg leading-none text-white">The Longbow</p>
              <p className="text-sm text-forest-700">{PRICE.sale} <span className="text-ink-soft line-through">{PRICE.compare}</span></p>
            </div>
          </div>
          <Link href={PRODUCT_HREF} className="btn btn-primary text-sm">Add to cart</Link>
        </div>
      </div>

      <PreviewSwitcher current="d" />
    </div>
  );
}
