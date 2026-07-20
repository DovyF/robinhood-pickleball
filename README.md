# 🎾 Robinhood Pickleball

A fully standalone, self-hosted ecommerce platform — a complete replacement for Shopify, owned entirely by you. Built for **robinhoodpickleball.com**.

## Stack

- **Next.js 16** (App Router) + **React** + **TypeScript**
- **Tailwind CSS v4** design system (forest green + gold)
- **Prisma** ORM — SQLite in dev, **PostgreSQL** in production
- **Auth.js v5** (credentials, JWT sessions, roles)
- **Stripe** (Payment Element: cards, Apple Pay, Google Pay, Link)
- **Resend** transactional email · **Cloudinary** image hosting
- Shipping: rule-based rates + optional **EasyPost/USPS/UPS/FedEx** live rates
- Analytics: built-in dashboard + **GA4 / Clarity / Meta Pixel / TikTok Pixel**

## Features

### Storefront
Home (CMS-driven sections) · product pages (gallery, variants, reviews, related) · collections with sort/filter · search · cart (drawer + page) · Stripe checkout · customer accounts (login / register / password reset / email verify) · order history · addresses · wishlist · discount codes · reviews · contact · FAQ / CMS pages · fully responsive · SEO (metadata, JSON-LD, sitemap, robots).

### Admin (`/admin`)
Dashboard KPIs · analytics (revenue, AOV, conversion, funnel, traffic, top products, LTV, abandoned carts, custom date ranges) · products CRUD with image upload / variants / inventory / pricing · collections · orders (fulfill, tracking, refunds, cancel, packing slips) · customers · discount codes · gift cards · homepage & navigation editor · pages · settings · audit logs · role-based access (owner / admin / staff).

## Getting started

```bash
npm install
npx prisma migrate dev      # create the dev database
npm run db:seed             # seed products, collections, admin user
npm run dev                 # http://localhost:3000
```

**Demo logins** (from the seed):
- Admin: `admin@robinhoodpickleball.com` / `ChangeMe123!`
- Customer: `customer@example.com` / `password123`

Demo discount codes: `WELCOME10`, `FREESHIP`, `SAVE20`.

> Checkout runs in **demo mode** (orders complete without a real charge) until you add Stripe keys — see below.

## Going live

1. **Database** — create a Postgres database (Neon, Railway, Supabase). In `prisma/schema.prisma` set `provider = "postgresql"`, then set `DATABASE_URL`. Run `npx prisma migrate deploy` and `npm run db:seed`.
2. **Environment** — copy `.env.example` → set real values. Generate `AUTH_SECRET` with `openssl rand -base64 32`.
3. **Stripe** — add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`. Point a webhook at `/api/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
4. **Email** — add `RESEND_API_KEY` and verify your sending domain.
5. **Images** — add Cloudinary keys (otherwise uploads save to `/public/uploads`, which is ephemeral on serverless hosts).
6. **Shipping (optional live rates)** — add `EASYPOST_API_KEY`.
7. **Analytics (optional)** — set the `NEXT_PUBLIC_*` pixel IDs.
8. **Deploy** — Vercel (recommended) or Railway. Point `robinhoodpickleball.com` at it and set `NEXT_PUBLIC_SITE_URL`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio (visual DB) |
| `npm run db:reset` | Reset + reseed the database |

## Project structure

```
src/
  app/
    (store)/        Storefront routes (home, product, cart, checkout, account…)
    admin/          Admin dashboard (its own layout, role-gated)
    actions/        Server actions (cart, checkout, auth, admin CRUD)
    api/            Route handlers (search, auth, Stripe webhook)
  components/       UI: layout, product, cart, checkout, account, admin, home
  lib/              prisma, auth, pricing, tax, shipping, orders, email, analytics
prisma/             schema + seed
```
