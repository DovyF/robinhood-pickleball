import Link from "next/link";
import { ArrowRight, Check, X, ShieldCheck, RotateCcw, Heart, Sparkles, Zap, Target } from "lucide-react";
import { IMG, PRICE, PRODUCT_HREF } from "./longbow-data";
import { Reveal } from "./Reveal";
import { StickyBuyBar } from "./StickyBuyBar";
import { ConstructionCutaway } from "./ConstructionCutaway";
import { HeroReckoning } from "./HeroReckoning";

/**
 * The conversion-engineered homepage.
 * Flow: Attention → clarity → instant trust → price reframe → proof-of-build →
 * benefits → founder authority → objection-killing → risk reversal → close.
 * Motion via <Reveal>, risk-free CTA always within reach via <StickyBuyBar>.
 * All claims honest (real scarcity, real story). FAQ emits JSON-LD for SEO.
 */

const UNITS_LEFT = 190; // first-batch inventory — wire to live stock before launch

const FAQS: [string, string][] = [
  ["Can I use it in tournaments?", "For rec play, drills, and casual leagues — absolutely, today. Official USAPA certification for sanctioned tournaments is in progress. This first batch is priced accordingly."],
  ["What if I don't like it?", "You have 21 days to send it back for a full refund. If the paddle arrived defective or it's a mistake on our end, we cover return shipping."],
  ["Is it really the same quality as a $250 paddle?", "It's built with the same core materials — a carbon-fiber and fiberglass face over a multi-density foam core. We cut the marketing budget and middleman markup, not the materials."],
  ["How does shipping work?", "Ships from the US via USPS — Ground Advantage or Priority Mail, calculated to your address at checkout."],
  ["Is there a warranty?", "Yes — a 6-month warranty against manufacturing defects. (It doesn't cover normal wear, or damage from misuse like cracking it on the ground.)"],
  ["Why only 190?", "This is the founder's first production batch. Once it's gone, the next batch ships USAPA-certified at $115."],
];

export function LandingPro() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="bg-[#0a0a0a]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* 1 · HERO — "The Reckoning" */}
      <HeroReckoning unitsLeft={UNITS_LEFT} />

      {/* 2 · TRUST BAR */}
      <section className="border-y border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="container-x grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
          {[
            { Icon: Sparkles, t: `Only ${UNITS_LEFT} left`, s: "First batch" },
            { Icon: RotateCcw, t: "21-day returns", s: "Money-back guarantee" },
            { Icon: ShieldCheck, t: "6-month warranty", s: "Against defects" },
            { Icon: Heart, t: "10% donated", s: "To those in need" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon size={22} className="shrink-0 text-forest-700" />
              <div>
                <p className="text-sm font-bold text-white">{t}</p>
                <p className="text-xs text-ink-soft">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 · PRICE REFRAME + COMPARISON */}
      <section className="container-x py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-700">The honest math</span>
          <h2 className="mt-3 font-display text-5xl leading-tight tracking-wide text-white sm:text-6xl">
            Same build. Half the price.<br />None of the markup.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            The big brands charge $250 and tell you that&apos;s what quality costs. We took the exact materials, cut the marketing budget and the middlemen, and gave the savings to you — and 10% to charity.
          </p>
        </Reveal>

        <Reveal delay={120} className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-[#1e1e1e]">
          <div className="grid grid-cols-3 bg-[#0d0d0d] text-sm">
            <div className="p-5" />
            <div className="border-x border-[#1e1e1e] bg-forest-700/[0.06] p-5 text-center">
              <p className="font-display text-2xl tracking-wide text-forest-700">The Longbow</p>
              <p className="font-display text-3xl text-white">$99.99</p>
            </div>
            <div className="p-5 text-center">
              <p className="font-display text-2xl tracking-wide text-ink-soft">Big-brand paddle</p>
              <p className="font-display text-3xl text-ink-soft">$250</p>
            </div>
          </div>
          {[
            ["Carbon-fiber + fiberglass face", true, true],
            ["Multi-density foam core", true, true],
            ["High-grit spin surface", true, true],
            ["10% donated to charity", true, false],
            ["Honest, no-markup price", true, false],
          ].map(([label, a, b], i) => (
            <div key={i} className="grid grid-cols-3 border-t border-[#1e1e1e] text-sm">
              <div className="p-4 text-ink-soft">{label as string}</div>
              <div className="border-x border-[#1e1e1e] bg-forest-700/[0.06] p-4 text-center">
                {a ? <Check size={18} className="mx-auto text-forest-700" /> : <X size={18} className="mx-auto text-[#555]" />}
              </div>
              <div className="p-4 text-center">
                {b ? <Check size={18} className="mx-auto text-ink-soft" /> : <X size={18} className="mx-auto text-[#555]" />}
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* 4 · PROOF OF BUILD — construction cutaway */}
      <ConstructionCutaway />

      {/* 5 · BENEFITS */}
      {[
        { Icon: Zap, tag: "The face", h: "Spin that grabs the ball", d: "A gritty carbon-fiber + fiberglass + carbon-fiber layup bites the ball for heavy, controllable spin — the kind you feel on every roll and dink.", img: IMG.grip },
        { Icon: Target, tag: "The core", h: "A sweet spot that forgives", d: "A notched, multi-density foam core widens the sweet spot and adds pop, so off-center hits still land where you want them.", img: IMG.edge },
        { Icon: ShieldCheck, tag: "The feel", h: "Fast hands at the kitchen", d: "Balanced swing weight and an elongated shape give you quick reactions and clean resets when the game speeds up.", img: IMG.throat },
      ].map((b, i) => (
        <section key={b.h} className={`border-t border-[#141414] ${i % 2 ? "bg-[#0d0d0d]" : ""}`}>
          <Reveal className={`container-x grid items-center gap-10 py-20 md:grid-cols-2 md:gap-16 ${i % 2 ? "md:[direction:rtl]" : ""}`}>
            <div className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-black [direction:ltr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.img} alt={b.h} className="h-full w-full object-cover" />
            </div>
            <div className="[direction:ltr]">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest-700"><b.Icon size={15} /> {b.tag}</span>
              <h2 className="mt-3 font-display text-4xl tracking-wide text-white sm:text-5xl">{b.h}</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">{b.d}</p>
            </div>
          </Reveal>
        </section>
      ))}

      {/* 6 · FOUNDER */}
      <section className="border-y border-[#1e1e1e] bg-gradient-to-br from-[#12200a] via-[#0d0d0d] to-[#0d0d0d]">
        <Reveal className="container-x grid items-center gap-12 py-24 md:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-black">
            {/* FOUNDER PHOTO SLOT — swap for a real photo of Dovy (ideally on-court) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.throatR} alt="Dovy Feder, founder of Robinhood Pickleball" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-700">Why we exist</span>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-wide text-white sm:text-5xl">I got tired of paying more for the name.</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft">
              <p>In 2024 I picked up pickleball with my friends and fell in love with it. A year in, we wanted to level up, so I went looking for a better paddle — ready to spend $100.</p>
              <p>Every reviewer said the same thing: the good paddles start at $250, and $100 is &ldquo;budget.&rdquo; I bought the highest-rated &ldquo;budget&rdquo; paddle for $130 — and on the court, it barely felt like an upgrade.</p>
              <p>That bothered me enough that I spent almost a year designing and manufacturing the paddle I wanted to exist: a genuinely high-performance foam paddle, built with premium materials, for <span className="text-white">$99.99</span>. That&apos;s the Longbow.</p>
            </div>
            <p className="mt-6 font-display text-2xl tracking-wide text-white">— Dovy Feder, Founder</p>
          </div>
        </Reveal>
      </section>

      {/* 7 · OBJECTION KILLER */}
      <section className="container-x py-20">
        <Reveal className="mx-auto max-w-3xl rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] p-8 sm:p-10">
          <h3 className="font-display text-3xl tracking-wide text-white">&ldquo;Is it USAPA-approved?&rdquo;</h3>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Straight answer: the Longbow is built to tournament spec, and official USAPA certification is in progress — it&apos;s a paperwork-and-fee step, not a performance one. For <span className="text-white">rec play, drills, and casual league games</span>, you&apos;re good to go today. If you play in <span className="text-white">sanctioned tournaments</span>, certification is on the way — and this first batch is priced accordingly.
          </p>
        </Reveal>
      </section>

      {/* 8 · SPECS */}
      <section className="border-y border-[#1e1e1e] bg-[#0d0d0d]">
        <Reveal className="container-x py-16">
          <h2 className="mb-8 font-display text-3xl tracking-wide text-white">Specifications</h2>
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {[
              ["Face", "Carbon Fiber + Fiberglass + Carbon Fiber"],
              ["Core", "Multi-Density Notched Foam"],
              ["Weight", "8 oz"],
              ["Paddle Length", "16.5 in"],
              ["Paddle Width", "7.5 in"],
              ["Handle Length", "5.5 in"],
              ["Grip Size", "4.25 in"],
              ["Surface", "High-grit, spin-focused"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-[#1e1e1e] pb-3">
                <span className="text-xs uppercase tracking-widest text-ink-soft">{k}</span>
                <span className="text-right font-medium text-white">{v}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 9 · RISK REVERSAL + SCARCITY CLOSE */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-forest-700/10 blur-[130px]" />
        <Reveal className="container-x relative py-24 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-5xl leading-tight tracking-wide text-white sm:text-6xl">
            Try it for 21 days.<br />Keep it for years.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
            Play with it. If it&apos;s not the best-value paddle you&apos;ve held, send it back within 21 days. If anything&apos;s wrong on our end, we cover the return shipping.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["21-day money-back guarantee", "6-month defect warranty", "10% donated to charity"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-[#2e2e2e] px-4 py-2 text-sm text-ink-soft">
                <Check size={15} className="text-forest-700" /> {t}
              </span>
            ))}
          </div>
          <Link href={PRODUCT_HREF} className="btn btn-primary mt-10 text-lg">Get the Longbow — {PRICE.sale} <ArrowRight size={20} /></Link>
          <p className="mt-4 text-sm text-forest-700">Only {UNITS_LEFT} left in the first batch · next batch ships at $115</p>
        </Reveal>
      </section>

      {/* 10 · FAQ */}
      <section className="border-t border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="container-x py-20">
          <h2 className="mb-10 font-display text-4xl tracking-wide text-white">Questions, answered</h2>
          <div className="mx-auto max-w-3xl divide-y divide-[#1e1e1e]">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-white">
                  {q}
                  <span className="ml-4 text-forest-700 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <StickyBuyBar image={IMG.face} href={PRODUCT_HREF} unitsLeft={UNITS_LEFT} />
    </div>
  );
}
