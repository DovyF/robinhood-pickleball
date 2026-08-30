import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

function slug(s: string) {
  return slugify(s, { lower: true, strict: true });
}

// Product image sets (Unsplash — loaded client-side by the browser).
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const PADDLE_IMGS = [
  img("photo-1626224583764-f87db24ac4ea"),
  img("photo-1611251126118-b7c3b0e2a1a9"),
];
const COURT_IMGS = [img("photo-1595435742656-5272d0b3fa82"), img("photo-1544298621-35a989e4e54a")];
const BALL_IMGS = [img("photo-1602519452874-9d8b0a9f2b1e")];
const APPAREL_IMGS = [img("photo-1556906781-9a412961c28c")];
const BAG_IMGS = [img("photo-1553062407-98eeb64c6a62")];

interface SeedProduct {
  title: string;
  type: string;
  price: number;
  compareAt?: number;
  description: string;
  tags: string;
  featured?: boolean;
  images: string[];
  options?: { name: string; values: string[] };
  weight?: number;
  rating: number;
  reviews: number;
  sales: number;
}

const LONGBOW_IMGS = [
  "/brand/longbow-1.png", // hero — full angled face
  "/brand/longbow-2.png", // face + grip detail
  "/brand/longbow-3.png", // throat with R mark
  "/brand/longbow-4.png", // end-cap R detail
  "/brand/longbow-5.png", // edge profile (thinness)
  "/brand/longbow-6.png", // throat with LONGBOW
];

const PRODUCTS: SeedProduct[] = [
  {
    title: "The Longbow",
    type: "Paddles",
    price: 99.99,
    description:
      "Explosive pop meets massive forgiveness. A multi-density notched foam core wrapped in a 3-layered carbon fiber + fiberglass + carbon fiber face delivers power, spin, and control that rivals paddles twice the price.\n\nSpecifications:\n• Face material: Carbon Fiber + Fiberglass + Carbon Fiber\n• Core: Multi-Density Notched Foam\n• Weight: 8 oz\n• Paddle length: 16.5 in · Width: 7.5 in\n• Handle length: 5.5 in · Grip size: 4.25 in\n• Not USAPA approved\n\n21-day return window on unused paddles — see our Return Policy for full details.",
    tags: "paddle,longbow,carbon,fiberglass,foam",
    featured: true,
    images: LONGBOW_IMGS,
    weight: 227,
    rating: 0,
    reviews: 0,
    sales: 500,
  },
];

async function main() {
  console.log("🌱 Seeding Robinhood Pickleball…");

  // ---- Admin / owner user ----
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@robinhoodpickleball.com").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "owner" },
    create: {
      email: adminEmail,
      name: "Store Owner",
      firstName: "Store",
      lastName: "Owner",
      role: "owner",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
  });
  console.log(`  ✓ Admin: ${adminEmail} / ${adminPass}`);

  // ---- Demo customer ----
  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Robin Hood",
      firstName: "Robin",
      lastName: "Hood",
      role: "customer",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  // ---- Products ----
  // Clear ALL existing products first so removed/renamed products never linger
  // (single-product store — stale rows would otherwise show up in search).
  const keepSlugs = PRODUCTS.map((p) => slug(p.title));
  const stale = await prisma.product.findMany({ where: { slug: { notIn: keepSlugs } }, select: { id: true } });
  const staleIds = stale.map((s) => s.id);
  if (staleIds.length) {
    for (const model of ["cartItem", "wishlistItem", "review", "collectionProduct", "orderItem", "productImage", "productVariant"] as const) {
      // @ts-expect-error dynamic model access
      await prisma[model].deleteMany({ where: { productId: { in: staleIds } } }).catch(() => {});
    }
    await prisma.product.deleteMany({ where: { id: { in: staleIds } } });
  }

  const created: { id: string; type: string; featured: boolean }[] = [];
  for (const p of PRODUCTS) {
    const s = slug(p.title);
    await prisma.product.deleteMany({ where: { slug: s } });
    const product = await prisma.product.create({
      data: {
        title: p.title,
        slug: s,
        description: p.description,
        descriptionHtml: `<p>${p.description}</p>`,
        productType: p.type,
        status: "active",
        featured: p.featured ?? false,
        price: p.price,
        compareAtPrice: p.compareAt,
        costPerItem: Math.round(p.price * 0.45 * 100) / 100,
        weightGrams: p.weight ?? 200,
        tags: p.tags,
        rating: p.rating,
        reviewCount: p.reviews,
        salesCount: p.sales,
        publishedAt: new Date(),
        seoTitle: `${p.title} | Robinhood Pickleball`,
        seoDescription: p.description.slice(0, 155),
        images: {
          create: p.images.map((url, i) => ({ url, position: i, altText: p.title })),
        },
      },
    });

    // Options + variants
    if (p.options) {
      await prisma.productOption.create({
        data: { productId: product.id, name: p.options.name, values: p.options.values.join(","), position: 0 },
      });
      let pos = 0;
      for (const v of p.options.values) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            title: v,
            sku: `${s.slice(0, 6).toUpperCase()}-${pos + 1}`,
            price: p.price,
            compareAtPrice: p.compareAt,
            option1: v,
            position: pos++,
            weightGrams: p.weight ?? 200,
            inventoryQty: 40,
          },
        });
      }
    } else {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          title: "Default",
          sku: `${s.slice(0, 8).toUpperCase()}`,
          price: p.price,
          compareAtPrice: p.compareAt,
          weightGrams: p.weight ?? 200,
          inventoryQty: 190, // real first-batch stock
          trackInventory: true,
        },
      });
    }

    // No seeded reviews — real reviews come from real customers.

    created.push({ id: product.id, type: p.type, featured: p.featured ?? false });
  }
  console.log(`  ✓ ${created.length} products`);

  // ---- Collections ----
  const collectionDefs = [
    { title: "All", desc: "The Longbow — one paddle, built to win.", types: ["Paddles"] },
  ];
  for (let i = 0; i < collectionDefs.length; i++) {
    const c = collectionDefs[i];
    const cs = slug(c.title);
    await prisma.collection.deleteMany({ where: { slug: cs } });
    const collection = await prisma.collection.create({
      data: {
        title: c.title,
        slug: cs,
        description: c.desc,
        status: "active",
        position: i,
        seoTitle: `${c.title} | Robinhood Pickleball`,
        seoDescription: c.desc,
      },
    });
    const members = created.filter((p) => c.types.some((t) => p.type === t));
    for (let j = 0; j < members.length; j++) {
      await prisma.collectionProduct.create({
        data: { collectionId: collection.id, productId: members[j].id, position: j },
      });
    }
  }
  console.log(`  ✓ ${collectionDefs.length} collections`);

  // ---- Navigation ----
  await prisma.navigationItem.deleteMany({});
  const mainNav = [
    { label: "Home", url: "/" },
    { label: "The Paddle", url: "/products/the-longbow" },
    { label: "About Us", url: "/pages/about" },
    { label: "FAQ", url: "/pages/faq" },
  ];
  for (let i = 0; i < mainNav.length; i++) {
    await prisma.navigationItem.create({ data: { menu: "main", label: mainNav[i].label, url: mainNav[i].url, position: i } });
  }
  const footerNav = [
    { label: "About Us", url: "/pages/about" },
    { label: "Contact", url: "/contact" },
    { label: "FAQ", url: "/pages/faq" },
    { label: "Shipping & Returns", url: "/pages/shipping-returns" },
    { label: "Start a Return", url: "/returns" },
    { label: "Track Order", url: "/account/orders" },
  ];
  for (let i = 0; i < footerNav.length; i++) {
    await prisma.navigationItem.create({ data: { menu: "footer", label: footerNav[i].label, url: footerNav[i].url, position: i } });
  }
  console.log(`  ✓ navigation`);

  // ---- Homepage sections ----
  await prisma.homepageSection.deleteMany({});
  const sections = [
    {
      type: "hero",
      title: "Take from the big brands. Give to your game.",
      position: 0,
      settingsJson: JSON.stringify({
        subtitle: "Tournament-grade pickleball gear at prices that don't rob you blind.",
        ctaLabel: "Shop Paddles",
        ctaUrl: "/collections/paddles",
        secondaryLabel: "Shop All",
        secondaryUrl: "/products",
        image: COURT_IMGS[0],
        align: "left",
      }),
    },
    { type: "logo_list", title: "As trusted by", position: 1, settingsJson: JSON.stringify({ items: ["USAPA Certification In Progress", "21-Day Returns", "6-Month Warranty", "10% Donated"] }) },
    { type: "featured_collection", title: "Best Sellers", position: 2, settingsJson: JSON.stringify({ collectionSlug: "paddles", limit: 4, source: "featured" }) },
    {
      type: "image_banner",
      title: "Built for the kitchen line",
      position: 3,
      settingsJson: JSON.stringify({ text: "Raw carbon faces. Poly cores. Spin for days.", ctaLabel: "Explore Paddles", ctaUrl: "/collections/paddles", image: PADDLE_IMGS[0] }),
    },
    { type: "product_grid", title: "New & Popular", position: 4, settingsJson: JSON.stringify({ source: "best-selling", limit: 8 }) },
    // No seeded testimonials — same as reviews, real quotes come from real customers.
    // Add this section back via /admin/content once there are genuine reviews to show.
    { type: "newsletter", title: "Join the merry band", position: 5, settingsJson: JSON.stringify({ subtitle: "Be first to hear about restocks and new drops." }) },
  ];
  for (const s of sections) {
    await prisma.homepageSection.create({ data: { type: s.type, title: s.title, position: s.position, enabled: true, settingsJson: s.settingsJson } });
  }
  console.log(`  ✓ homepage sections`);

  // ---- Discount codes ----
  // No sign-up / welcome discount. Add codes from the admin as needed.
  await prisma.discountCode.deleteMany({});
  console.log(`  ✓ discount codes (none)`);

  // ---- Pages ----
  const pages = [
    { title: "About", slug: "about", body: "<h2>Our Story</h2><p>Robinhood Pickleball was founded on a simple idea: elite pickleball gear shouldn't cost a fortune. We cut out the middlemen and the inflated brand markups so you get tournament-quality paddles at honest prices.</p><p>The Longbow is built to tournament spec — official USAPA certification is in progress — and every paddle is backed by a 6-month warranty against manufacturing defects. Play more. Pay less.</p>" },
    { title: "FAQ", slug: "faq", body: "<h2>Frequently Asked Questions</h2><h3>Are your paddles tournament legal?</h3><p>For rec play, drills, and casual leagues — absolutely, today. Official USAPA certification for sanctioned tournaments is in progress.</p><h3>What's your return policy?</h3><p>21-day return window on unused paddles. Used or play-worn paddles aren't eligible for a refund. See our full <a href=\"/pages/shipping-returns\">Return Policy</a> or <a href=\"/returns\">start a return</a>.</p><h3>How fast is shipping?</h3><p>Ships from the US via USPS — Ground Advantage or Priority Mail, calculated to your address at checkout.</p><h3>Do you offer a warranty?</h3><p>Every paddle carries a 6-month warranty against manufacturing defects.</p>" },
    { title: "Shipping & Returns", slug: "shipping-returns", body: "<h2>Shipping</h2><p>Ships from the US via USPS — Ground Advantage or Priority Mail, calculated to your address at checkout.</p><h2>Returns</h2><p>We offer a 21-day return window from the date your order is delivered (or from your order date if no tracking is available). To start a return, visit our <a href=\"/returns\">Returns Center</a> and enter your order number and email — we'll ask for a couple of photos so we can check the paddle's condition before approving.</p><h3>Eligible for a refund</h3><ul><li>Unused paddles in like-new condition — no play wear, scuffing, or edge damage</li><li>Items that arrived damaged or defective</li><li>Wrong item shipped</li></ul><h3>Not eligible for a refund</h3><ul><li><strong>Used paddles.</strong> Any paddle showing signs of play — ball-strike marks on the face, edge guard scuffing, grip wear, or added tape — is not eligible for a money-back refund. If the issue is a manufacturing defect, we'll offer a warranty replacement or repair instead.</li><li><strong>\"Not USAPA-approved\" is not a valid return reason.</strong> This is disclosed on the product page before you buy — the paddle is legal for rec play, drills, and non-sanctioned leagues, and USAPA certification for sanctioned tournament play is in progress. Requests to return an otherwise-fine paddle for this reason won't be approved.</li><li>Paddles that have been physically modified (added edge tape, lead tape, grip swaps, sanding, etc.)</li><li>Returns submitted without photos, or outside the 21-day window, unless the issue is a manufacturing defect</li><li>Original shipping costs — return shipping is the customer's responsibility unless we shipped the wrong item or it arrived damaged</li></ul><p>Approved returns are refunded to your original payment method within 5-10 business days of us receiving and inspecting the item. Every paddle also carries a separate <a href=\"/pages/faq\">6-month warranty</a> against manufacturing defects, independent of the return window.</p>" },
  ];
  for (const pg of pages) {
    await prisma.page.deleteMany({ where: { slug: pg.slug } });
    await prisma.page.create({ data: { title: pg.title, slug: pg.slug, bodyHtml: pg.body, status: "published" } });
  }
  console.log(`  ✓ pages`);

  // ---- Store settings ----
  const settings: Record<string, string> = {
    store_name: "Robinhood Pickleball",
    store_email: "hello@robinhoodpickleball.com",
    currency: "USD",
    tax_shipping: "false",
    brand_primary: "#90d034",
    brand_accent: "#b6f858",
    announcement: "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(`  ✓ settings`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
