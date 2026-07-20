import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMG, PRICE, FEATURES, SPECS, PRODUCT_HREF } from "./longbow-data";
import { PreviewSwitcher } from "./PreviewSwitcher";

/**
 * Variant B — "Spotlight."
 * Apple-style minimal: centered product on black with a neon glow, huge negative
 * space, one calm statement per section. Premium and quiet.
 */
export function LandingB() {
  return (
    <div className="bg-black">
      {/* Centered spotlight hero */}
      <section className="relative flex min-h-[96svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-700/15 blur-[130px]" />
        <span className="relative mb-6 text-xs font-bold uppercase tracking-[0.4em] text-forest-700">The Longbow</span>
        <h1 className="relative font-display text-[15vw] leading-[0.85] text-white sm:text-[10vw]">MADE TO WIN</h1>
        <p className="relative mt-6 max-w-md text-lg text-ink-soft">Explosive power. Forgiving touch. One paddle, engineered to end the search.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.face} alt="The Longbow paddle" className="animate-fade-up relative mt-2 max-h-[52svh] w-auto object-contain drop-shadow-[0_0_60px_rgba(144,208,52,0.25)]" />
        <div className="relative -mt-4 flex items-center gap-5">
          <Link href={PRODUCT_HREF} className="btn btn-primary text-base">Buy — {PRICE.sale} <ArrowRight size={18} /></Link>
          <span className="text-ink-soft line-through">{PRICE.compare}</span>
        </div>
      </section>

      {/* Calm full-screen feature statements */}
      {FEATURES.map((f, i) => {
        const photo = [IMG.grip, IMG.edge, IMG.throatR][i];
        return (
          <section key={f.h} className="flex min-h-[80svh] items-center border-t border-[#141414] px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
              <div className={i % 2 ? "md:order-2" : ""}>
                <h2 className="font-display text-5xl leading-[1.05] tracking-wide text-white sm:text-6xl">{f.h}</h2>
                <p className="mt-6 max-w-md text-xl leading-relaxed text-ink-soft">{f.d}</p>
              </div>
              <div className={`relative ${i % 2 ? "md:order-1" : ""}`}>
                <div className="pointer-events-none absolute inset-0 rounded-full bg-forest-700/10 blur-[90px]" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="relative mx-auto max-h-[60svh] w-auto object-contain" />
              </div>
            </div>
          </section>
        );
      })}

      {/* Minimal spec grid */}
      <section className="border-t border-[#141414] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-display text-5xl tracking-wide text-white">The Details</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 md:grid-cols-3">
            {SPECS.map((s) => (
              <div key={s.k} className="text-center">
                <p className="text-xs uppercase tracking-widest text-ink-soft">{s.k}</p>
                <p className="mt-2 font-display text-2xl tracking-wide text-white">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-[#141414] px-6 py-28 text-center">
        <h2 className="font-display text-6xl tracking-wide text-white sm:text-7xl">Your last paddle,<br /><span className="text-forest-700">for a while.</span></h2>
        <Link href={PRODUCT_HREF} className="btn btn-primary mt-10 text-base">Buy the Longbow — {PRICE.sale} <ArrowRight size={18} /></Link>
        <p className="mt-6 text-sm text-ink-soft">21-day money-back guarantee · 10% of profits donated to those in need</p>
      </section>

      <PreviewSwitcher current="b" />
    </div>
  );
}
