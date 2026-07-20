import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { IMG, PRICE, FEATURES, STATS, PRODUCT_HREF } from "./longbow-data";
import { PreviewSwitcher } from "./PreviewSwitcher";

/**
 * Variant A — "Editorial."
 * Split-screen typographic hero (no paddle-overlay reuse), marquee, alternating
 * full-bleed spreads, value band, sticky buy-bar. Fashion-brand energy.
 */
export function LandingA() {
  return (
    <div className="bg-[#0a0a0a]">
      {/* Split hero */}
      <section className="grid min-h-[92svh] md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <span className="mb-6 text-xs font-bold uppercase tracking-[0.35em] text-forest-700">Pickleball, rebuilt</span>
          <h1 className="font-display text-[19vw] leading-[0.82] text-white md:text-[8vw]">
            THE<br />LONG<span className="text-forest-700">BOW</span>
          </h1>
          <div className="mt-4 h-1.5 w-24 bg-forest-700" />
          <p className="mt-8 max-w-sm text-lg leading-relaxed text-ink-soft">
            A tournament-grade paddle at a fraction of the price. Explosive power, forgiving touch — built for battle.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={PRODUCT_HREF} className="btn btn-primary text-base">Shop now — {PRICE.sale} <ArrowRight size={18} /></Link>
            <span className="text-ink-soft line-through">{PRICE.compare}</span>
          </div>
        </div>
        <div className="relative min-h-[50svh] overflow-hidden bg-black md:min-h-0">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-700/20 blur-[100px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG.throat} alt="The Longbow paddle" className="relative h-full w-full object-cover" />
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-[#1e1e1e] bg-forest-700 py-3">
        <div className="flex whitespace-nowrap">
          {[0, 1].map((g) => (
            <div key={g} className="flex animate-marquee" aria-hidden={g === 1}>
              {Array(6).fill(0).map((_, i) => (
                <span key={i} className="mx-6 font-display text-2xl tracking-wide text-[#0d0d0d]">BUILT FOR BATTLE ✦ MADE TO WIN ✦</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stat band */}
      <section className="container-x grid grid-cols-2 gap-y-10 py-16 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-6xl leading-none text-white">{s.n}<span className="ml-1 text-2xl text-forest-700">{s.u}</span></p>
            <p className="mt-2 text-xs uppercase tracking-widest text-ink-soft">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Alternating spreads */}
      {FEATURES.map((f, i) => {
        const photo = [IMG.face, IMG.grip, IMG.edge][i];
        const reverse = i % 2 === 1;
        return (
          <section key={f.h} className="container-x py-16">
            <div className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${reverse ? "md:[direction:rtl]" : ""}`}>
              <div className="overflow-hidden rounded-2xl bg-[#111] [direction:ltr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="[direction:ltr]">
                <span className="font-display text-8xl leading-none text-[#1c1c1c]">0{i + 1}</span>
                <h2 className="-mt-6 font-display text-4xl tracking-wide text-white sm:text-5xl">{f.h}</h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">{f.d}</p>
              </div>
            </div>
          </section>
        );
      })}

      {/* Value band */}
      <section className="border-y border-[#1e1e1e] bg-gradient-to-br from-[#12200a] via-[#0d0d0d] to-[#0d0d0d]">
        <div className="container-x py-20 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-5xl leading-tight text-white sm:text-6xl">
            Why pay <span className="text-ink-soft line-through decoration-forest-700 decoration-4">$250</span> when <span className="text-forest-700">$99.99</span> plays better?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">We cut the markup, not the materials — and 10% of every sale goes to those in need.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {["21-day money-back guarantee", "Secure checkout", "10% donated to charity"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-[#2e2e2e] px-4 py-2 text-sm text-ink-soft">
                <Check size={15} className="text-forest-700" /> {t}
              </span>
            ))}
          </div>
          <Link href={PRODUCT_HREF} className="btn btn-primary mt-10 text-base">Get the Longbow <ArrowRight size={18} /></Link>
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

      <PreviewSwitcher current="a" />
    </div>
  );
}
