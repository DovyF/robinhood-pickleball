import Link from "next/link";
import { ArrowRight, Sparkles, RotateCcw, Heart } from "lucide-react";
import { IMG, PRICE, PRODUCT_HREF } from "./longbow-data";

/**
 * "The Reckoning" hero — the price anchor IS the headline. Built like $250
 * (struck through), priced at $99. Hero-lit product, one CTA, one honest trust
 * strip. Robust two-column layout that never balloons the product.
 */
export function HeroReckoning({ unitsLeft = 190 }: { unitsLeft?: number }) {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-glow-breathe absolute left-[70%] top-1/2 h-[55vmax] w-[55vmax] rounded-full bg-forest-700/12 blur-[130px]" />
      </div>

      <div className="container-x relative grid min-h-[86svh] items-center gap-10 py-14 md:grid-cols-2 md:gap-8 md:py-10">
        {/* Copy — leads on mobile so value + CTA are above the fold */}
        <div className="relative z-10">
          <p className="animate-hero-rise text-xs font-bold uppercase tracking-[0.28em] text-forest-700" style={{ animationDelay: "0ms" }}>
            The Longbow · Premium pickleball paddle
          </p>

          <h1 className="mt-5 font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl">
            <span className="animate-hero-rise block" style={{ animationDelay: "80ms" }}>
              Built like{" "}
              <span className="text-ink-soft line-through decoration-forest-700 decoration-[6px]">$250</span>.
            </span>
            <span className="animate-hero-rise block" style={{ animationDelay: "180ms" }}>
              Priced at <span className="text-forest-700">$99</span>.
            </span>
          </h1>

          <p className="animate-hero-rise mt-6 max-w-md text-lg leading-relaxed text-ink-soft" style={{ animationDelay: "300ms" }}>
            The same carbon-and-foam construction the big brands charge a fortune for — without the markup. And 10% of every sale goes to those in need.
          </p>

          <div className="animate-hero-rise mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "400ms" }}>
            <Link href={PRODUCT_HREF} className="btn btn-primary text-base">
              Shop the Longbow — {PRICE.sale} <ArrowRight size={18} />
            </Link>
            <span className="text-sm text-ink-soft">21-day money-back guarantee</span>
          </div>

          <ul className="animate-hero-rise mt-9 flex flex-col gap-3 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7" style={{ animationDelay: "520ms" }}>
            <li className="inline-flex items-center gap-2"><Sparkles size={15} className="shrink-0 text-forest-700" /> Only {unitsLeft} left in the first batch</li>
            <li className="inline-flex items-center gap-2"><RotateCcw size={15} className="shrink-0 text-forest-700" /> 21-day returns</li>
            <li className="inline-flex items-center gap-2"><Heart size={15} className="shrink-0 text-forest-700" /> 10% donated</li>
          </ul>
        </div>

        {/* Product — capped on every breakpoint so it can never balloon */}
        <div className="relative flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMG.face}
            alt="The Longbow pickleball paddle"
            className="animate-hero-float mx-auto h-auto max-h-[40svh] w-auto max-w-full object-contain md:max-h-[66svh]"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse 70% 74% at 50% 47%, #000 55%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 70% 74% at 50% 47%, #000 55%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
