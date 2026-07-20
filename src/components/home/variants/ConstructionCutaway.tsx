"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

/**
 * Construction cutaway — the exploded render, grouped by material. Hovering a
 * material box makes every layer of that material glow with a feathered lime
 * halo. Each layer is a real Photoshop-separated PNG on a transparent canvas
 * (all 1834×1032, aligned to the base render), so the glow hugs the exact
 * silhouette via drop-shadow on the alpha channel — no hand-traced paths.
 *
 * Symmetric 7-layer layup, left → right:
 * Carbon / Fiberglass / Carbon / Foam / Carbon / Fiberglass / Carbon.
 */

// Which physical layer PNGs belong to each material.
const GROUPS = [
  { key: "carbon", n: "01", name: "Carbon Fiber", benefit: "4 layers — power, durability, and stiffness", layers: [1, 3, 5, 7] },
  { key: "fiberglass", n: "02", name: "Fiberglass", benefit: "2 layers — flex and touch", layers: [2, 6] },
  { key: "foam", n: "03", name: "Multi-Density Notched Foam Core", benefit: "Wider sweet spot, more pop", layers: [4] },
];

// Feathered lime halo that follows each PNG's alpha silhouette exactly.
const GLOW =
  "drop-shadow(0 0 4px #b6f14e) drop-shadow(0 0 12px #a3e635) drop-shadow(0 0 26px rgba(163,230,53,0.55))";

export function ConstructionCutaway() {
  const [active, setActive] = useState<number | null>(null);
  const someActive = active != null;
  const activeLayers = active != null ? GROUPS[active].layers : [];

  return (
    <section className="border-y border-[#1e1e1e] bg-black">
      <div className="container-x py-14">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-700">What&apos;s inside</span>
          <h2 className="mt-3 font-display text-5xl leading-tight tracking-wide text-white sm:text-6xl">See the build</h2>
          <p className="mt-4 text-lg text-ink-soft">
            No mystery, no marketing fluff. Hover a material to light up every layer of it in the paddle.
          </p>
        </Reveal>

        <Reveal delay={100} className="relative mx-auto mt-6 max-w-2xl">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-700/10 blur-[100px]" />

          <div
            className="relative"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse 82% 82% at 50% 50%, #000 62%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 82% 82% at 50% 50%, #000 62%, transparent 100%)",
            }}
          >
            {/* Base render sits underneath to fill the gaps between slices and the
                parts not carried by the 7 layer PNGs (handle, edge guard). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/exploded.jpg"
              alt="Exploded view of the Longbow — 4 carbon-fiber plates and 2 fiberglass sheets around a notched foam core"
              className="relative w-full transition-[filter] duration-300"
              style={{ filter: active != null ? "brightness(0.5)" : "none" }}
            />

            {/* The 7 real layer PNGs, painted back-to-front so their true depth is
                preserved: layer 1 is the front face (drawn last, on top, never
                occluded), layer 7 is the backmost. Because later siblings paint on
                top, a lit back layer is correctly occluded by the slices in front of
                it — its glow only shows on the portion that's actually exposed. */}
            {[7, 6, 5, 4, 3, 2, 1].map((n) => {
              const on = activeLayers.includes(n);
              const filter = on ? GLOW : someActive ? "brightness(0.5)" : "none";
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={`/brand/layer-${n}.png`}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full transition-[filter] duration-300"
                  style={{ filter }}
                />
              );
            })}
          </div>
        </Reveal>

        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
          {GROUPS.map((g, i) => (
            <Reveal key={g.key} delay={i * 80}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`h-full w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                  active === i ? "border-forest-700 bg-forest-700/[0.08] shadow-glow" : "border-[#1e1e1e] bg-[#0d0d0d] hover:border-forest-700/50"
                }`}
              >
                <span className="font-display text-2xl tracking-wide text-forest-700">{g.n}</span>
                <p className="mt-1 font-semibold leading-tight text-white">{g.name}</p>
                <p className="mt-1 text-sm text-ink-soft">{g.benefit}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
