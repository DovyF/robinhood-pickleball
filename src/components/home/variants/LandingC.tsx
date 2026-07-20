import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Heart } from "lucide-react";
import { IMG, PRICE, SPECS, PRODUCT_HREF } from "./longbow-data";
import { PreviewSwitcher } from "./PreviewSwitcher";

/**
 * Variant C — "Poster."
 * Loud, kinetic, oversized overlapping typography and diagonal energy. A
 * manifesto band, a detail gallery, brand story, and a guarantee close.
 */
export function LandingC() {
  return (
    <div className="bg-[#0a0a0a]">
      {/* Poster hero — overlapping type over an angled paddle */}
      <section className="relative min-h-[94svh] overflow-hidden">
        <div className="pointer-events-none absolute -right-24 top-1/2 h-[90%] w-[70%] -translate-y-1/2 rotate-[8deg]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG.face} alt="The Longbow paddle" className="h-full w-full object-contain drop-shadow-[0_0_80px_rgba(0,0,0,0.8)]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        <div className="container-x relative flex min-h-[94svh] flex-col justify-center">
          <span className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-forest-700">Robinhood · The Longbow</span>
          <h1 className="font-display text-white">
            <span className="block text-[24vw] leading-[0.8] sm:text-[16vw]">BUILT</span>
            <span className="block pl-[12vw] text-[24vw] leading-[0.8] text-forest-700 sm:text-[16vw]">FOR WAR</span>
            <span className="block text-[24vw] leading-[0.8] sm:text-[16vw]">ON COURT</span>
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={PRODUCT_HREF} className="btn btn-primary text-base">Claim yours — {PRICE.sale} <ArrowRight size={18} /></Link>
            <span className="text-ink-soft line-through">{PRICE.compare}</span>
          </div>
        </div>
      </section>

      {/* Manifesto band */}
      <section className="border-y-2 border-forest-700 bg-forest-700">
        <div className="container-x py-14">
          <p className="font-display text-4xl leading-tight tracking-wide text-[#0d0d0d] sm:text-6xl">
            SAME CARBON THE PROS PAY $250 FOR. HALF THE PRICE. 10% GIVEN BACK.
          </p>
        </div>
      </section>

      {/* Detail gallery */}
      <section className="container-x py-20">
        <h2 className="mb-10 font-display text-5xl tracking-wide text-white">Engineered edge to edge</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { img: IMG.grip, label: "Cushioned, tacky grip" },
            { img: IMG.throatR, label: "Signature throat mark" },
            { img: IMG.endcap, label: "Sealed end cap" },
          ].map((d) => (
            <div key={d.label} className="group relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.img} alt={d.label} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5">
                <p className="font-display text-xl tracking-wide text-white">{d.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story — big offset type */}
      <section className="relative overflow-hidden border-y border-[#1e1e1e] bg-gradient-to-bl from-[#12200a] via-[#0d0d0d] to-[#0d0d0d]">
        <div className="container-x grid items-center gap-12 py-24 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-6xl leading-[0.95] tracking-wide text-white sm:text-7xl">
              WE GOT TIRED<br /><span className="text-forest-700">OF $250</span><br />PADDLES.
            </h2>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-soft">
              So we built our own — the same premium carbon build, none of the markup — and we give 10% of every sale to those in need. That&apos;s the whole idea.
            </p>
            <Link href="/pages/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-forest-700 hover:gap-3 transition-all">Read our story <ArrowRight size={16} /></Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#1e1e1e]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.throat} alt="The Longbow" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Spec table */}
      <section className="container-x py-16">
        <h2 className="mb-8 font-display text-4xl tracking-wide text-white">The Specs</h2>
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {SPECS.map((s) => (
            <div key={s.k} className="flex items-baseline justify-between border-b border-[#1e1e1e] pb-3">
              <span className="text-xs uppercase tracking-widest text-ink-soft">{s.k}</span>
              <span className="text-right font-medium text-white">{s.v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee close */}
      <section className="border-t border-[#1e1e1e] bg-black">
        <div className="container-x flex flex-col items-center gap-7 py-20 text-center">
          <h2 className="font-display text-6xl tracking-wide text-white">TRY IT RISK-FREE</h2>
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

      <PreviewSwitcher current="c" />
    </div>
  );
}
