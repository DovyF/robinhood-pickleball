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
      "Explosive pop meets massive forgiveness. A multi-density notched foam core wrapped in a 3-layered carbon fiber + fiberglass + carbon fiber face delivers power, spin, and control that rivals paddles twice the price.\n\nSpecifications:\n• Face material: Carbon Fiber + Fiberglass + Carbon Fiber\n• Core: Multi-Density Notched Foam\n• Weight: 8 oz\n• Paddle length: 16.5 in · Width: 7.5 in\n• Handle length: 5.5 in · Grip size: 4.25 in\n• Not USAPA approved\n\n21-day money-back guarantee. If you're not completely satisfied with The Longbow (which is unlikely), then return it.",
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
    { type: "logo_list", title: "As trusted by", position: 1, settingsJson: JSON.stringify({ items: ["USAPA Approved", "Free Shipping $75+", "30-Day Returns", "2-Year Warranty"] }) },
    { type: "featured_collection", title: "Best Sellers", position: 2, settingsJson: JSON.stringify({ collectionSlug: "paddles", limit: 4, source: "featured" }) },
    {
      type: "image_banner",
      title: "Built for the kitchen line",
      position: 3,
      settingsJson: JSON.stringify({ text: "Raw carbon faces. Poly cores. Spin for days.", ctaLabel: "Explore Paddles", ctaUrl: "/collections/paddles", image: PADDLE_IMGS[0] }),
    },
    { type: "product_grid", title: "New & Popular", position: 4, settingsJson: JSON.stringify({ source: "best-selling", limit: 8 }) },
    { type: "testimonials", title: "Loved by 10,000+ players", position: 5, settingsJson: JSON.stringify({ items: [
      { name: "Marcus T.", quote: "Best paddle I've owned, and half the price of the name brands.", rating: 5 },
      { name: "Priya S.", quote: "Fast shipping and the control paddle is unreal at the net.", rating: 5 },
      { name: "Dave L.", quote: "Got the starter set for my parents — they're obsessed now.", rating: 5 },
    ] }) },
    { type: "newsletter", title: "Join the merry band", position: 6, settingsJson: JSON.stringify({ subtitle: "Be first to hear about restocks and new drops." }) },
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
    { title: "About", slug: "about", body: "<h2>Our Story</h2><p>Robinhood Pickleball was founded on a simple idea: elite pickleball gear shouldn't cost a fortune. We cut out the middlemen and the inflated brand markups so you get tournament-quality paddles, balls, and gear at honest prices.</p><p>Every paddle is USAPA approved and backed by a 2-year warranty. Play more. Pay less.</p>" },
    { title: "FAQ", slug: "faq", body: "<h2>Frequently Asked Questions</h2><h3>Are your paddles tournament legal?</h3><p>Yes — every paddle we sell is USAPA/USA Pickleball approved for sanctioned play.</p><h3>What's your return policy?</h3><p>30-day returns on unused gear, no questions asked.</p><h3>How fast is shipping?</h3><p>Orders ship within 1 business day. Free standard shipping on orders over $75.</p><h3>Do you offer a warranty?</h3><p>All paddles carry a 2-year manufacturer warranty against defects.</p>" },
    { title: "Shipping & Returns", slug: "shipping-returns", body: "<h2>Shipping</h2><p>Free standard shipping on orders over $75. Orders placed before 2pm ET ship same day. Expedited and overnight options available at checkout.</p><h2>Returns</h2><p>Not happy? Return unused items within 30 days for a full refund. We'll email you a prepaid label.</p>" },
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
