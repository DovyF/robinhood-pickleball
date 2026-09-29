/**
 * Additive, idempotent seed for the SEO content hub.
 *
 * Upserts the long-form guide pages (and their footer nav links) that
 * `GUIDE_SLUGS` in the /pages/[slug] route already wires Article schema up for.
 * Safe to re-run: every write is an upsert keyed on the unique slug, and
 * nothing outside these records is touched.
 *
 *   npx tsx prisma/seed-guides.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pages = [
  {
    slug: "foam-pickleball-paddle-guide",
    title: "Foam Core Pickleball Paddles: What Changed, and Who They're For",
    seoTitle: "Foam Core Pickleball Paddles — Full Guide (2026)",
    seoDescription:
      "How foam-core pickleball paddles differ from honeycomb, what the foam actually does to the sweet spot, and how to tell a real foam core from marketing copy.",
    bodyHtml: `
<p>Foam core paddles went from a niche experiment to the dominant construction in competitive pickleball in about two seasons. This guide explains what the foam is actually doing, where it helps, where it doesn't, and how to read a spec sheet without getting sold to.</p>

<h2>What a foam core actually is</h2>
<p>A conventional paddle has a polypropylene honeycomb core — a grid of hollow hexagonal cells sandwiched between two faces. It's light, cheap to make, and it works. Its weakness is structural: the cells near the edge of the paddle have less material bracing them than the cells in the middle, so the paddle responds differently depending on where you make contact. That difference is what players feel as a small sweet spot.</p>
<p>A foam core paddle replaces some or all of that honeycomb with injected or inserted polymer foam. There are three common approaches, and they are not the same thing:</p>
<h3>Perimeter foam injection</h3>
<p>Honeycomb core, with foam injected around the inside edge of the frame. The most common construction sold as "foam" today. The foam braces the weak perimeter cells, which is where most of the sweet-spot gain comes from.</p>
<h3>Full foam core</h3>
<p>The honeycomb is replaced entirely. More consistent face response and a noticeably different, deader sound, but harder to keep inside the USAP weight limits without giving up pop.</p>
<h3>Foam-notched or hybrid core</h3>
<p>Honeycomb with structured foam channels running through it rather than just around the rim. Aims for the perimeter bracing of injection with more of the face-wide consistency of a full core.</p>

<h2>What the foam does to your game</h2>
<p>Three effects, in order of how much you'll actually notice them:</p>
<p><strong>A larger usable face.</strong> This is the real one. Mishits off the upper corners and near the throat lose less speed than they do on a bare honeycomb core. You don't hit the ball more accurately — the paddle just punishes you less when you don't.</p>
<p><strong>Longer dwell time.</strong> Foam compresses and rebounds more slowly than a hollow cell wall. The ball stays on the face fractionally longer, which gives the face texture more time to grip it. That's why foam and high-grit carbon faces get paired so often: the spin gain comes from the combination, not the foam alone.</p>
<p><strong>A quieter, duller sound.</strong> Some players read this as a lack of power. It isn't — it's damping. But it is a genuine adjustment if you've played honeycomb for years, and it's worth a few sessions before you judge the paddle.</p>

<h2>Who should not buy one</h2>
<p>Honest answer: if you're a hard-hitting singles player who wants maximum raw pop and you already hit the middle of the face consistently, foam gives you less than the marketing suggests. The forgiveness you're paying for is forgiveness you don't need, and some foam builds trade a little top-end power to get it. Dinkers, doubles players, anyone still developing consistency, and anyone with elbow issues get the most out of it.</p>

<h2>How to tell real foam from a foam sticker</h2>
<ul>
<li><strong>Ask which construction it is.</strong> "Foam injected" is not "full foam core." A brand that won't say which one it uses is telling you something.</li>
<li><strong>Check the swing weight, not just the static weight.</strong> Perimeter foam adds mass at the edges, which raises swing weight more than the scale suggests. A paddle can be 8.0 oz and still feel sluggish.</li>
<li><strong>Look for a USAP listing.</strong> If it isn't on the approved equipment list, no amount of core technology matters for tournament play.</li>
<li><strong>Be skeptical of thermoforming claims.</strong> Thermoforming (a unibody hot-pressed build) is a separate process from the core material. Plenty of paddles claim both and deliver one.</li>
</ul>

<h2>What a foam core should cost</h2>
<p>Foam injection adds real cost to a build, but not $150 of it. The premium brands charging $230–$260 for a perimeter-injected carbon paddle are pricing against tour sponsorships and athlete contracts, not against the bill of materials. The same construction sells in the $90–$130 range from brands that don't carry that overhead.</p>
<p>We make one, <a href="/products/the-longbow">The Longbow</a> — a notched foam core with a carbon/fiberglass/carbon face, at $99.99. We're obviously not a neutral party on that, so treat the construction checklist above as the useful part of this page and go verify it against whatever you're considering, including ours.</p>
`,
  },
  {
    slug: "best-budget-pickleball-paddle",
    title: "The Best Budget Pickleball Paddle: An Honest Buyer's Guide",
    seoTitle: "Best Budget Pickleball Paddle — What to Buy Under $100",
    seoDescription:
      "What actually separates a $90 pickleball paddle from a $250 one, which specs are worth paying for, and how to buy a budget paddle without buying a bad one.",
    bodyHtml: `
<p>Most "best budget pickleball paddle" lists are affiliate roundups that rank whatever pays the highest commission. This one is written by a brand that sells a $99.99 paddle, which is its own kind of bias — so it's structured to be useful even if you buy someone else's.</p>

<h2>Where the money actually goes in a $250 paddle</h2>
<p>Take a premium paddle apart and you find a raw carbon or toray face, a polymer or foam core, an edge guard, and a grip. At volume, that bill of materials runs roughly $25–$45. The rest of a $250 price tag is pro tour sponsorships, athlete endorsement contracts, retail margin, and paid placement in the review lists you're probably also reading.</p>
<p>None of that is fraud — sponsoring a tour is a legitimate way to build a brand. But it means the price gap between a $99 paddle and a $249 paddle is mostly not a materials gap, and you should stop assuming it is.</p>

<h2>The four specs worth paying for</h2>
<h3>1. Face material</h3>
<p>Raw or T700 carbon fiber grips the ball meaningfully better than fiberglass or composite. This is the spec most worth defending in a budget build — a paddle that saved money here saved it in the wrong place.</p>
<h3>2. Core construction</h3>
<p>Foam-injected or foam-notched cores widen the sweet spot. See the <a href="/pages/foam-pickleball-paddle-guide">foam core guide</a> for what the different constructions actually mean, because the term gets used loosely.</p>
<h3>3. Core thickness</h3>
<p>14mm favors control and forgiveness; 16mm adds power and a firmer feel. Neither is better. 14mm is the safer default if you're unsure or you play mostly doubles.</p>
<h3>4. USAP approval</h3>
<p>Free to verify, and non-negotiable if you might ever play a sanctioned tournament. Check the official approved equipment list, not the brand's own claim.</p>

<h2>What you can safely give up under $100</h2>
<ul>
<li><strong>Elaborate handle tech.</strong> Vibration-damping handle systems are real but marginal. Overgrip costs $5.</li>
<li><strong>Colorways and pro signatures.</strong> Obvious, but it's a surprising share of the premium.</li>
<li><strong>Thermoforming.</strong> A well-built cold-pressed paddle with a good core outperforms a badly executed thermoformed one. The process is not a guarantee.</li>
<li><strong>Brand-name edge guards.</strong> They all chip.</li>
</ul>

<h2>What should make you walk away</h2>
<ul>
<li>No stated core material or thickness anywhere on the product page.</li>
<li>No USAP listing, on a paddle marketed for competitive play.</li>
<li>Fiberglass face sold as "carbon-infused" or similar hedged language.</li>
<li>No return window, or a return window that excludes paddles you've actually hit with. A paddle you can't test is a paddle you can't evaluate.</li>
<li>Reviews that are all five stars and all posted the same week.</li>
</ul>

<h2>How to test one once it arrives</h2>
<p>Give any new paddle three sessions before judging it — the first session is always about adjusting, not about the paddle. Then check three specific things: how badly an intentional upper-corner mishit drops off, whether you can reset a hard drive into the kitchen without popping it up, and whether your hand or elbow feels worse after two hours than it did with your old paddle. Those three answers tell you more than any spec sheet.</p>

<h2>Our paddle, stated plainly</h2>
<p><a href="/products/the-longbow">The Longbow</a> is $99.99: a three-layer carbon/fiberglass/carbon face, a notched foam core, and a 21-day return window that covers paddles you've played with. 10% of profits are donated. We think it holds up against paddles at twice the price, and we'd rather you test that claim against the checklist above than take our word for it.</p>
`,
  },
  {
    slug: "robinhood-longbow-paddle",
    title: "The Robinhood Longbow Paddle — Specs, Construction, and FAQ",
    seoTitle: "Robinhood Longbow Pickleball Paddle — Specs & Full Details",
    seoDescription:
      "Full specifications, construction details, and common questions about the Robinhood Longbow pickleball paddle (also searched as the Robin Hood Longbow). $99.99, foam core, carbon face.",
    bodyHtml: `
<p>This page collects everything about the Longbow in one place — construction, full specs, and the questions we get asked most. To buy it, go to <a href="/products/the-longbow">the product page</a>.</p>
<p>A note on the name: people search for this paddle as the <strong>Robinhood Longbow</strong>, the <strong>Robin Hood Longbow</strong>, and the <strong>Longbow pickleball paddle</strong>. They're all the same paddle — Robinhood Pickleball is the brand, the Longbow is the paddle. We're not affiliated with the stock trading app, and we don't sell archery equipment.</p>

<h2>Construction</h2>
<h3>The face</h3>
<p>Three layers: carbon fiber, then fiberglass, then carbon fiber. The fiberglass layer between the two carbon sheets is deliberate — carbon alone is stiff and precise but can feel harsh, and the fiberglass ply gives back some pop and a softer response without costing much grip.</p>
<h3>The core</h3>
<p>A notched foam core rather than plain polypropylene honeycomb. The notching runs foam structure through the core instead of only around the rim, which braces the weak perimeter cells where most mishits land. The practical effect is that off-center contact loses less ball speed. See the <a href="/pages/foam-pickleball-paddle-guide">foam core guide</a> for how this compares to other foam constructions.</p>
<h3>The balance</h3>
<p>Built to a low swing weight so the paddle stays fast in hand-battles at the kitchen line, which is where a heavier power paddle costs you points.</p>

<h2>Specifications</h2>
<ul>
<li><strong>Face:</strong> Carbon fiber / fiberglass / carbon fiber, 3-layer</li>
<li><strong>Core:</strong> Notched foam</li>
<li><strong>Price:</strong> $99.99 (compare at $115)</li>
<li><strong>Returns:</strong> 21 days, including paddles you've played with</li>
<li><strong>Giving:</strong> 10% of profits donated to those in need</li>
</ul>

<h2>Common questions</h2>
<h3>Is the Longbow a control paddle or a power paddle?</h3>
<p>It leans control-forward. The foam core and low swing weight favor resets, dinks, and fast hands; the carbon/fiberglass/carbon face keeps enough pop that drives don't feel dead. If you want a pure power stick for singles, this isn't that paddle.</p>
<h3>How does it compare to $200+ paddles?</h3>
<p>The construction is comparable — foam core, carbon face, tournament-spec build. What you're not paying for is tour sponsorship and retail markup. We cover where that money goes in the <a href="/pages/best-budget-pickleball-paddle">budget paddle guide</a>.</p>
<h3>What if I don't like it?</h3>
<p>Send it back within 21 days. The window covers paddles you've actually hit with — a paddle you can't test is a paddle you can't evaluate, so returning a used one is the whole point.</p>
<h3>Who is it best for?</h3>
<p>Doubles players, anyone still building consistency, anyone coming off a small-sweet-spot honeycomb paddle, and anyone who wants current-generation construction without a $250 price tag.</p>
`,
  },
];

const navLinks = [
  { label: "Paddle Guide", url: "/pages/best-budget-pickleball-paddle", position: 20 },
  { label: "Foam Cores Explained", url: "/pages/foam-pickleball-paddle-guide", position: 21 },
  { label: "The Longbow", url: "/pages/robinhood-longbow-paddle", position: 22 },
];

async function main() {
  for (const p of pages) {
    const { slug, ...rest } = p;
    await prisma.page.upsert({
      where: { slug },
      create: { slug, status: "published", ...rest },
      update: { status: "published", ...rest },
    });
    console.log(`page  ✓ /pages/${slug}`);
  }

  // NavigationItem has no unique key on (menu, url), so dedupe by hand.
  for (const link of navLinks) {
    const existing = await prisma.navigationItem.findFirst({ where: { menu: "footer", url: link.url } });
    if (existing) {
      await prisma.navigationItem.update({ where: { id: existing.id }, data: link });
    } else {
      await prisma.navigationItem.create({ data: { menu: "footer", ...link } });
    }
    console.log(`nav   ✓ ${link.label}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
