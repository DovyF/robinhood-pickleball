import Link from "next/link";
import { ArrowRight, Trophy, Crosshair, Heart, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { IMG, PRICE, FEATURES, SPECS, PRODUCT_HREF } from "./longbow-data";
import { PreviewSwitcher } from "./PreviewSwitcher";

/**
 * Variant F — "Richer" (original re-add-sections draft).
 * The current flow plus a craftsmanship detail band, a brand-story section, and
 * a guarantee band. (No fabricated testimonials/reviews.)
 */
export function LandingF() {
  return (
    <div className="bg-[#0d0d0d]">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-black" style={{ height: "100svh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.heroBg} alt="The Longbow paddle" className="animate-paddle-ambient h-full w-full object-cover" style={{ objectPosition: "center 70%" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.heroOverlay} alt="Built for Battles. Made to Win." className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      </section>

      {/* Feature bar */}
      <section className="border-y border-forest-700/40 bg-[#0d0d0d]">
        <div className="container-x grid gap-6 py-9 sm:grid-cols-3">
          {[
            { Icon: Trophy, h: "PREMIUM PERFORMANCE", s: "Same materials as $200 paddles." },
            { Icon: Crosshair, h: "POWER. CONTROL. SPIN.", s: "Engineered for players who compete." },
            { Icon: Heart, h: "GIVE BACK", s: "10% of profits donated to those in need." },
          ].map(({ Icon, h, s }) => (
            <div key={h} className="flex items-center gap-3">
              <Icon size={30} strokeWidth={1.5} className="shrink-0 text-forest-700" />
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-white">{h}</p>
                <p className="text-[13px] text-ink-soft">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section className="bg-black px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2 md:gap-[60px]">
          <div className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.face} alt="The Longbow paddle" className="block h-auto w-full object-cover" />
          </div>
          <div>
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-forest-700">The Paddle</span>
            <h2 className="font-display text-6xl leading-[1.05] tracking-wide text-white">The Longbow</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">An explosively powerful paddle with a controlled, forgiving feel.</p>
            <div className="my-8 space-y-5">
              {FEATURES.map((f) => (
                <div key={f.h} className="border-l-2 border-[#27272a] pl-5">
                  <h3 className="font-semibold text-white">{f.h}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#8a8a8a]">{f.d}</p>
                </div>
              ))}
            </div>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-display text-5xl text-forest-700">{PRICE.sale}</span>
              <span className="text-lg text-ink-soft line-through">{PRICE.compare}</span>
              <span className="rounded bg-forest-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0d0d0d]">{PRICE.save}</span>
            </div>
            <Link href={PRODUCT_HREF} className="btn btn-primary">View Details <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Craftsmanship detail band */}
      <section className="border-y border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="container-x py-20">
          <div className="mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-700">In the details</span>
            <h2 className="mt-2 font-display text-4xl tracking-wide text-white sm:text-5xl">Engineered edge to edge</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { img: IMG.grip, label: "Cushioned, tacky grip" },
              { img: IMG.throatR, label: "Signature throat mark" },
              { img: IMG.endcap, label: "Sealed end cap" },
            ].map((d) => (
              <div key={d.label} className="group relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt={d.label} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4">
                  <p className="text-sm font-semibold text-white">{d.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#12200a] via-[#0d0d0d] to-[#0d0d0d]">
        <div className="container-x grid items-center gap-10 py-20 md:grid-cols-2">
          <div>
            <Sparkles size={28} className="mb-4 text-forest-700" />
            <h2 className="font-display text-5xl leading-tight tracking-wide text-white">Built by players, priced for everyone</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              We got tired of watching people pay $250 for a paddle. So we made our own — the same premium carbon build, none of the markup —
              and we give 10% of every sale to those in need. That&apos;s the whole idea.
            </p>
            <Link href="/pages/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-forest-700 hover:gap-3 transition-all">Read our story <ArrowRight size={16} /></Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#1e1e1e]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.edge} alt="The Longbow edge profile" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Spec table */}
      <section className="bg-[#0d0d0d]">
        <div className="container-x py-16">
          <h2 className="mb-8 font-display text-3xl tracking-wide text-white">Specifications</h2>
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {SPECS.map((s) => (
              <div key={s.k} className="flex items-baseline justify-between border-b border-[#1e1e1e] pb-3">
                <span className="text-xs uppercase tracking-widest text-ink-soft">{s.k}</span>
                <span className="text-right font-medium text-white">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee band */}
      <section className="border-t border-[#1e1e1e] bg-black">
        <div className="container-x flex flex-col items-center gap-8 py-16 text-center">
          <h2 className="font-display text-4xl tracking-wide text-white sm:text-5xl">Try it risk-free</h2>
          <p className="max-w-xl text-ink-soft">21-day money-back guarantee. If you&apos;re not completely satisfied with The Longbow (which is unlikely), then return it.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { Icon: RotateCcw, t: "21-day money-back" },
              { Icon: ShieldCheck, t: "Secure checkout" },
              { Icon: Heart, t: "10% donated to charity" },
            ].map(({ Icon, t }) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-[#2e2e2e] px-4 py-2 text-sm text-ink-soft">
                <Icon size={15} className="text-forest-700" /> {t}
              </span>
            ))}
          </div>
          <Link href={PRODUCT_HREF} className="btn btn-primary text-base">Get the Longbow — {PRICE.sale} <ArrowRight size={18} /></Link>
        </div>
      </section>

      <PreviewSwitcher current="f" />
    </div>
  );
}
