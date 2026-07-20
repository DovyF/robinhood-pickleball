import Link from "next/link";
import { ArrowRight, Zap, DollarSign, ShieldCheck, Trophy, Crosshair, Heart } from "lucide-react";
import { IMG, PRICE, FEATURES, SPECS, PRODUCT_HREF } from "./longbow-data";
import { PreviewSwitcher } from "./PreviewSwitcher";

/**
 * Variant E — "Elevated" (original elevate-the-current draft).
 * Same sections/order as the current landing, leveled up: gradients, glow,
 * depth, refined type, plus a spec strip.
 */
export function LandingE() {
  return (
    <div className="bg-[#0d0d0d]">
      {/* Hero (unchanged iconic layout) */}
      <section className="relative w-full overflow-hidden bg-black" style={{ height: "100svh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.heroBg} alt="The Longbow paddle" className="animate-paddle-ambient h-full w-full object-cover" style={{ objectPosition: "center 70%" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.heroOverlay} alt="Built for Battles. Made to Win." className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d0d0d] to-transparent" />
      </section>

      {/* Feature bar — with glow + hover */}
      <section className="border-y border-forest-700/40 bg-[#0d0d0d]">
        <div className="container-x grid gap-6 py-10 sm:grid-cols-3">
          {[
            { Icon: Trophy, h: "PREMIUM PERFORMANCE", s: "Same materials as $200 paddles." },
            { Icon: Crosshair, h: "POWER. CONTROL. SPIN.", s: "Engineered for players who compete." },
            { Icon: Heart, h: "GIVE BACK", s: "10% of profits donated to those in need." },
          ].map(({ Icon, h, s }) => (
            <div key={h} className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.03]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest-700/10 text-forest-700 transition-transform group-hover:scale-110">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-white">{h}</p>
                <p className="text-[13px] text-ink-soft">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase — richer, with glow behind the paddle */}
      <section className="relative overflow-hidden bg-black px-6 py-20 sm:px-10">
        <div className="pointer-events-none absolute left-1/4 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-forest-700/15 blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2 md:gap-[60px]">
          <div className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] shadow-[0_0_60px_-15px_rgba(144,208,52,0.25)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.face} alt="The Longbow paddle" className="block h-auto w-full object-cover" />
          </div>
          <div>
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-forest-700">The Paddle</span>
            <h2 className="font-display text-6xl leading-[1.05] tracking-wide text-white">The Longbow</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">An explosively powerful paddle with a controlled, forgiving feel.</p>
            <div className="my-8 space-y-5">
              {FEATURES.map((f) => (
                <div key={f.h} className="border-l-2 border-forest-700/60 pl-5">
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

      {/* Spec strip */}
      <section className="border-y border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="container-x py-14">
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

      {/* Why this paddle — refined cards */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-display text-5xl tracking-wide text-white sm:text-6xl">Why <span className="text-forest-700">This Paddle</span></h2>
            <p className="mt-5 text-lg text-ink-soft">We got tired of seeing players pay $250 for paddles. So we built one ourselves. For everyone.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: Zap, h: "High-Level Performance", d: "Built with the same materials used in premium paddles. No shortcuts." },
              { Icon: DollarSign, h: "Fair, Honest Pricing", d: "We cut out the markup, not the quality. You pay for the paddle, not the hype." },
              { Icon: ShieldCheck, h: "Built to Last", d: "Durable construction designed for thousands of games. We stand behind every paddle." },
            ].map(({ Icon, h, d }) => (
              <div key={h} className="group rounded-2xl border border-[#2e2e2e] bg-gradient-to-b from-[#161616] to-[#111] p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-forest-700/60 hover:shadow-glow">
                <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-forest-700/10 text-forest-700 transition-colors group-hover:bg-forest-700/20"><Icon size={30} /></div>
                <h3 className="font-display text-2xl tracking-wide text-white">{h}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PreviewSwitcher current="e" />
    </div>
  );
}
