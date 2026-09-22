import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";
import { safeJson } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

export function rangeFromParam(param?: string): DateRange {
  const to = new Date();
  if (param === "all") return { from: new Date("2020-01-01"), to };
  const days = param === "7d" ? 7 : param === "90d" ? 90 : param === "12m" ? 365 : 30;
  return { from: startOfDay(subDays(to, days - 1)), to };
}

/** Distinct visitor sessions in range (page_view events grouped by sessionId) — the correct
 * denominator for conversion rate and the funnel's "Sessions" stage. Not a raw event count. */
export async function countDistinctSessions(range: DateRange): Promise<number> {
  const rows = await prisma.analyticsEvent.findMany({
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to }, sessionId: { not: null } },
    select: { sessionId: true, metaJson: true },
  });
  const human = new Set(rows.filter((r) => !isBotEvent(r.metaJson)).map((r) => r.sessionId));
  return human.size;
}

/** Core KPIs for the admin dashboard within a date range. */
export async function getDashboardMetrics(range: DateRange) {
  const paidWhere = { paymentStatus: "paid", paidAt: { gte: range.from, lte: range.to } };

  const [paidOrders, prevPaidOrders, sessions, checkouts, newCustomers, returningAgg] = await Promise.all([
    prisma.order.findMany({ where: paidWhere, select: { total: true, userId: true, paidAt: true } }),
    prisma.order.findMany({
      where: { paymentStatus: "paid", paidAt: { gte: subDays(range.from, dayspan(range)), lt: range.from } },
      select: { total: true },
    }),
    countDistinctSessions(range),
    prisma.analyticsEvent.count({ where: { type: "begin_checkout", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.order.groupBy({ by: ["userId"], where: paidWhere, _count: true }),
  ]);

  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevPaidOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = paidOrders.length;
  const aov = orderCount ? revenue / orderCount : 0;
  const conversionRate = sessions ? (orderCount / sessions) * 100 : 0;
  const returningCustomers = returningAgg.filter((g) => g.userId && g._count > 1).length;

  return {
    revenue,
    revenueChange: pctChange(revenue, prevRevenue),
    orderCount,
    aov,
    conversionRate,
    sessions,
    checkouts,
    newCustomers,
    returningCustomers,
  };
}

function dayspan(range: DateRange) {
  return Math.max(1, Math.round((+range.to - +range.from) / 86400000));
}
function pctChange(cur: number, prev: number) {
  if (!prev) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

/** Daily revenue + order series for charts. */
export async function getSalesSeries(range: DateRange) {
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "paid", paidAt: { gte: range.from, lte: range.to } },
    select: { total: true, paidAt: true },
  });
  const buckets = new Map<string, { revenue: number; orders: number }>();
  const days = dayspan(range) + 1;
  for (let i = 0; i < days; i++) {
    const key = format(subDays(range.to, days - 1 - i), "yyyy-MM-dd");
    buckets.set(key, { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    if (!o.paidAt) continue;
    const key = format(o.paidAt, "yyyy-MM-dd");
    const b = buckets.get(key);
    if (b) { b.revenue += o.total; b.orders += 1; }
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
}

export async function getTopProducts(range: DateRange, limit = 8) {
  const items = await prisma.orderItem.groupBy({
    by: ["productId", "title"],
    where: { order: { paymentStatus: "paid", paidAt: { gte: range.from, lte: range.to } } },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });
  return items.map((i) => ({ productId: i.productId, title: i.title, units: i._sum.quantity ?? 0, revenue: i._sum.total ?? 0 }));
}

export async function getTrafficSources(range: DateRange) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ["utmSource"],
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
    _count: true,
  });
  const total = events.reduce((s, e) => s + e._count, 0) || 1;
  return events
    .map((e) => ({ source: e.utmSource || "Direct", visits: e._count, pct: (e._count / total) * 100 }))
    .sort((a, b) => b.visits - a.visits);
}

export async function getFunnel(range: DateRange) {
  const [sessions, productViews, addToCart, checkout, purchase] = await Promise.all([
    countDistinctSessions(range),
    prisma.analyticsEvent.count({ where: { type: "product_view", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "add_to_cart", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "begin_checkout", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "purchase", createdAt: { gte: range.from, lte: range.to } } }),
  ]);
  return [
    { stage: "Sessions", count: sessions },
    { stage: "Product views", count: productViews },
    { stage: "Added to cart", count: addToCart },
    { stage: "Reached checkout", count: checkout },
    { stage: "Purchased", count: purchase },
  ];
}

export async function getAbandonedCarts(range: DateRange) {
  const carts = await prisma.cart.findMany({
    where: { status: "active", updatedAt: { gte: range.from, lte: range.to }, items: { some: {} } },
    include: { items: { include: { product: true, variant: true } }, user: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return carts
    .filter((c) => c.email || c.user)
    .map((c) => ({
      id: c.id,
      email: c.email ?? c.user?.email ?? "—",
      value: c.items.reduce((s, it) => s + (it.variant?.price ?? it.product.price) * it.quantity, 0),
      items: c.items.length,
      updatedAt: c.updatedAt,
    }));
}

export async function getCustomerLifetimeValue() {
  const agg = await prisma.order.groupBy({
    by: ["userId"],
    where: { paymentStatus: "paid", userId: { not: null } },
    _sum: { total: true },
    _count: true,
  });
  const count = agg.length || 1;
  const totalLtv = agg.reduce((s, a) => s + (a._sum.total ?? 0), 0);
  return { avgLtv: totalLtv / count, customers: agg.length };
}

function isBotEvent(metaJson: string | null): boolean {
  return !!safeJson<{ isBot?: boolean }>(metaJson, {}).isBot;
}

/** Session duration, bounce rate, pages per session. Excludes bot/crawler traffic. */
export async function getSessionMetrics(range: DateRange) {
  const events = (
    await prisma.analyticsEvent.findMany({
      where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
      select: { sessionId: true, createdAt: true, metaJson: true },
      orderBy: { createdAt: "asc" },
    })
  ).filter((e) => !isBotEvent(e.metaJson));

  const sessions = new Map<string, { first: Date; last: Date; count: number }>();
  for (const e of events) {
    const sid = e.sessionId || "unknown";
    const s = sessions.get(sid);
    if (s) {
      s.last = e.createdAt;
      s.count++;
    } else {
      sessions.set(sid, { first: e.createdAt, last: e.createdAt, count: 1 });
    }
  }

  const durations = Array.from(sessions.values()).map((s) => (s.last.getTime() - s.first.getTime()) / 1000);
  const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const bounces = Array.from(sessions.values()).filter((s) => s.count === 1).length;
  const bounceRate = sessions.size ? (bounces / sessions.size) * 100 : 0;
  const avgPagesPerSession = sessions.size ? events.length / sessions.size : 0;

  return { avgDuration, bounceRate, avgPagesPerSession, totalSessions: sessions.size };
}

/** Top pages by views. Excludes bot/crawler traffic. */
export async function getTopPages(range: DateRange, limit = 8) {
  const events = (
    await prisma.analyticsEvent.findMany({
      where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
      select: { path: true, metaJson: true },
    })
  ).filter((e) => !isBotEvent(e.metaJson));

  const pages = new Map<string, number>();
  for (const e of events) {
    const path = e.path || "/";
    pages.set(path, (pages.get(path) ?? 0) + 1);
  }

  return Array.from(pages.entries())
    .map(([path, count]) => ({ path, views: count }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/** Resolve a human-readable traffic source label from UTM/referrer data. */
export function sourceFromEvent(utmSource?: string | null, referrer?: string | null): string {
  if (utmSource) return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
  if (referrer) {
    try {
      const domain = new URL(referrer).hostname.replace("www.", "");
      // Meta's outbound-link redirector (l.facebook.com / lm.facebook.com) is shared
      // infrastructure used by BOTH Instagram and Facebook when a tap on an in-app
      // link goes through the "you're leaving the app" interstitial — the hostname
      // alone can't tell them apart, so don't confidently call it "Facebook" when it
      // could just as easily be an Instagram bio/DM/story link.
      if (domain === "l.facebook.com" || domain === "lm.facebook.com") return "Instagram/Facebook (via Meta link)";
      if (domain.includes("instagram")) return "Instagram";
      if (domain.includes("facebook")) return "Facebook";
      if (domain.includes("google")) return "Google";
      if (domain.includes("twitter") || domain.includes("x.com") || domain === "t.co") return "Twitter/X";
      if (domain.includes("pinterest")) return "Pinterest";
      if (domain.includes("reddit")) return "Reddit";
      if (domain.includes("tiktok")) return "TikTok";
      return domain;
    } catch {
      return "Referral";
    }
  }
  return "Direct";
}

/** Traffic sources including direct, organic, referral, social, etc. Excludes bot/crawler traffic. */
export async function getDetailedTrafficSources(range: DateRange) {
  const events = (
    await prisma.analyticsEvent.findMany({
      where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
      select: { utmSource: true, referrer: true, metaJson: true },
    })
  ).filter((e) => !isBotEvent(e.metaJson));

  const sources = new Map<string, number>();
  for (const e of events) {
    const source = sourceFromEvent(e.utmSource, e.referrer);
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  const total = Array.from(sources.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(sources.entries())
    .map(([source, count]) => ({ source, visits: count, pct: (count / total) * 100 }))
    .sort((a, b) => b.visits - a.visits);
}

export interface SessionSummary {
  sessionId: string;
  firstSeen: Date;
  lastSeen: Date;
  durationSec: number;
  pageViews: number;
  entryPath: string;
  exitPath: string;
  source: string;
  device: string;
  browser: string;
  os: string;
  converted: boolean;
  orderValue: number;
  userEmail: string | null;
  isBot: boolean;
  botName: string | null;
}

/** Every session in range, newest first, with full timing/device/conversion detail.
 * Includes bot/crawler sessions (flagged via isBot) rather than hiding them — the
 * caller decides whether to show them. */
export async function getSessionsList(range: DateRange, limit = 200): Promise<SessionSummary[]> {
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: range.from, lte: range.to }, sessionId: { not: null } },
    select: { sessionId: true, type: true, path: true, referrer: true, utmSource: true, metaJson: true, value: true, orderId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byOrderId = [...new Set(events.filter((e) => e.orderId).map((e) => e.orderId as string))];
  const orders = byOrderId.length ? await prisma.order.findMany({ where: { id: { in: byOrderId } }, select: { id: true, email: true } }) : [];
  const orderEmail = new Map(orders.map((o) => [o.id, o.email]));

  const sessions = new Map<string, typeof events>();
  for (const e of events) {
    const sid = e.sessionId as string;
    if (!sessions.has(sid)) sessions.set(sid, []);
    sessions.get(sid)!.push(e);
  }

  const summaries: SessionSummary[] = [];
  for (const [sessionId, evs] of sessions) {
    const pageViews = evs.filter((e) => e.type === "page_view");
    const first = evs[0];
    const last = evs[evs.length - 1];
    const meta = pageViews[0] ? safeJson<{ device?: string; browser?: string; os?: string; isBot?: boolean; botName?: string }>(pageViews[0].metaJson, {}) : {};
    const purchase = evs.find((e) => e.type === "purchase");
    const orderId = purchase?.orderId ?? evs.find((e) => e.orderId)?.orderId ?? null;

    summaries.push({
      sessionId,
      firstSeen: first.createdAt,
      lastSeen: last.createdAt,
      durationSec: (last.createdAt.getTime() - first.createdAt.getTime()) / 1000,
      pageViews: pageViews.length,
      entryPath: pageViews[0]?.path ?? "—",
      exitPath: pageViews[pageViews.length - 1]?.path ?? "—",
      source: sourceFromEvent(pageViews[0]?.utmSource, pageViews[0]?.referrer),
      device: meta.device ?? "Unknown",
      browser: meta.browser ?? "Unknown",
      os: meta.os ?? "Unknown",
      converted: !!purchase,
      orderValue: purchase?.value ?? 0,
      userEmail: orderId ? orderEmail.get(orderId) ?? null : null,
      isBot: !!meta.isBot,
      botName: meta.botName ?? null,
    });
  }

  return summaries.sort((a, b) => b.firstSeen.getTime() - a.firstSeen.getTime()).slice(0, limit);
}

export interface SessionEvent {
  type: string;
  createdAt: Date;
  label: string;
}

/** Full chronological event timeline for a single session. */
export async function getSessionDetail(sessionId: string): Promise<SessionEvent[]> {
  const events = await prisma.analyticsEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  const productIds = [...new Set(events.filter((e) => e.productId).map((e) => e.productId as string))];
  const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } }) : [];
  const productTitle = new Map(products.map((p) => [p.id, p.title]));

  const orderIds = [...new Set(events.filter((e) => e.orderId).map((e) => e.orderId as string))];
  const orders = orderIds.length ? await prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNumber: true } }) : [];
  const orderNumber = new Map(orders.map((o) => [o.id, o.orderNumber]));

  return events.map((e) => {
    let label = e.type;
    if (e.type === "page_view") label = `Viewed page ${e.path}`;
    else if (e.type === "product_view") label = `Viewed product: ${e.productId ? productTitle.get(e.productId) ?? "product" : "product"}`;
    else if (e.type === "add_to_cart") label = `Added to cart: ${e.productId ? productTitle.get(e.productId) ?? "product" : "product"}`;
    else if (e.type === "begin_checkout") label = `Began checkout${e.orderId ? ` — order #${orderNumber.get(e.orderId) ?? "?"}` : ""} (${e.value ? `$${e.value.toFixed(2)}` : ""})`;
    else if (e.type === "purchase") label = `Purchased${e.orderId ? ` — order #${orderNumber.get(e.orderId) ?? "?"}` : ""} ($${(e.value ?? 0).toFixed(2)})`;
    else if (e.type === "search") label = `Searched: "${safeJson<{ q?: string }>(e.metaJson, {}).q ?? ""}"`;
    return { type: e.type, createdAt: e.createdAt, label };
  });
}

export interface LegacyEvent {
  type: string;
  createdAt: Date;
  label: string;
  email: string | null;
}

/**
 * Events recorded before session tracking existed (sessionId is null) — no
 * cookie, no device, no email, because none of that was ever captured for
 * product_view/add_to_cart. The only identity available is for events tied
 * to a real order (begin_checkout/purchase), via that order's email.
 */
export async function getLegacyEvents(range: DateRange, limit = 500): Promise<LegacyEvent[]> {
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: range.from, lte: range.to }, sessionId: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const productIds = [...new Set(events.filter((e) => e.productId).map((e) => e.productId as string))];
  const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } }) : [];
  const productTitle = new Map(products.map((p) => [p.id, p.title]));

  const orderIds = [...new Set(events.filter((e) => e.orderId).map((e) => e.orderId as string))];
  const orders = orderIds.length ? await prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNumber: true, email: true } }) : [];
  const orderInfo = new Map(orders.map((o) => [o.id, o]));

  return events.map((e) => {
    let label = e.type;
    const order = e.orderId ? orderInfo.get(e.orderId) : undefined;
    if (e.type === "page_view") label = `Viewed page ${e.path ?? "?"}`;
    else if (e.type === "product_view") label = `Viewed product: ${e.productId ? productTitle.get(e.productId) ?? "product" : "product"}`;
    else if (e.type === "add_to_cart") label = `Added to cart: ${e.productId ? productTitle.get(e.productId) ?? "product" : "product"}`;
    else if (e.type === "begin_checkout") label = `Began checkout${order ? ` — order #${order.orderNumber}` : ""} (${e.value ? `$${e.value.toFixed(2)}` : ""})`;
    else if (e.type === "purchase") label = `Purchased${order ? ` — order #${order.orderNumber}` : ""} ($${(e.value ?? 0).toFixed(2)})`;
    else if (e.type === "search") label = `Searched: "${safeJson<{ q?: string }>(e.metaJson, {}).q ?? ""}"`;
    return { type: e.type, createdAt: e.createdAt, label, email: order?.email ?? null };
  });
}

export interface SessionProfile {
  source: string;
  referrer: string | null;
  referrerHost: string | null;
  searchQuery: string | null;
  searchQueryNote: string | null;
  landingPath: string | null;
  landingUrl: string | null;
  utm: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  clickIds: { label: string; value: string }[];
  device?: string;
  browser?: string;
  os?: string;
  userAgent?: string;
  location: string | null;
  language?: string;
  timezone?: string;
  screen?: string;
  viewport?: string;
  isBot: boolean;
  botName?: string;
  pagesViewed: number;
  exitPage: string | null;
  email: string | null;
}

const CLICK_ID_PARAMS: Record<string, string> = {
  gclid: "Google Ads click",
  gbraid: "Google Ads click (iOS app)",
  wbraid: "Google Ads click (web-to-app)",
  srsltid: "Google Shopping / Merchant listing",
  fbclid: "Facebook/Instagram link click",
  igshid: "Instagram share",
  msclkid: "Microsoft/Bing Ads click",
  ttclid: "TikTok Ads click",
  twclid: "X (Twitter) Ads click",
  li_fat_id: "LinkedIn Ads click",
  ref: "Referral tag",
};

/** Everything known about how a single session arrived and who it was (device/location), in one place. */
export async function getSessionProfile(sessionId: string): Promise<SessionProfile | null> {
  const events = await prisma.analyticsEvent.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });
  if (events.length === 0) return null;

  const pageViews = events.filter((e) => e.type === "page_view");
  const firstPv = pageViews[0] ?? events[0];
  // The first page view carries the landing/locale/geo payload; later ones only device info.
  const meta = pageViews.map((e) => safeJson<Record<string, string | boolean | undefined>>(e.metaJson, {})).find((m) => m.landingUrl) ?? safeJson<Record<string, string | boolean | undefined>>(firstPv.metaJson, {});

  const referrer = firstPv.referrer;
  let referrerHost: string | null = null;
  let searchQuery: string | null = null;
  let searchQueryNote: string | null = null;
  if (referrer) {
    try {
      const u = new URL(referrer);
      referrerHost = u.hostname;
      const q = u.searchParams.get("q") || u.searchParams.get("p") || u.searchParams.get("query");
      if (q) searchQuery = q;
      else if (/google\./.test(u.hostname)) searchQueryNote = "Google hides the exact search terms from websites (since 2011, for privacy). Aggregated search terms show up in Google Search Console → Performance.";
    } catch {}
  }

  const landingUrl = typeof meta.landingUrl === "string" ? meta.landingUrl : null;
  const utm: SessionProfile["utm"] = {
    source: firstPv.utmSource ?? undefined,
    medium: firstPv.utmMedium ?? undefined,
    campaign: firstPv.utmCampaign ?? undefined,
  };
  const clickIds: SessionProfile["clickIds"] = [];
  if (landingUrl) {
    try {
      const params = new URL(landingUrl).searchParams;
      utm.term = params.get("utm_term") ?? undefined;
      utm.content = params.get("utm_content") ?? undefined;
      for (const [key, label] of Object.entries(CLICK_ID_PARAMS)) {
        const v = params.get(key);
        if (v) clickIds.push({ label, value: v });
      }
    } catch {}
  }

  const orderIds = events.map((e) => e.orderId).filter(Boolean) as string[];
  const order = orderIds.length ? await prisma.order.findFirst({ where: { id: { in: orderIds } }, select: { email: true } }) : null;

  const locationParts = [meta.city, meta.region, meta.country].filter((x) => typeof x === "string" && x) as string[];

  return {
    source: sourceFromEvent(firstPv.utmSource, referrer),
    referrer,
    referrerHost,
    searchQuery,
    searchQueryNote,
    landingPath: firstPv.path,
    landingUrl,
    utm,
    clickIds,
    device: meta.device as string | undefined,
    browser: meta.browser as string | undefined,
    os: meta.os as string | undefined,
    userAgent: meta.userAgent as string | undefined,
    location: locationParts.length ? locationParts.join(", ") : null,
    language: meta.language as string | undefined,
    timezone: meta.timezone as string | undefined,
    screen: meta.screen as string | undefined,
    viewport: meta.viewport as string | undefined,
    isBot: meta.isBot === true,
    botName: meta.botName as string | undefined,
    pagesViewed: pageViews.length,
    exitPage: pageViews[pageViews.length - 1]?.path ?? null,
    email: order?.email ?? null,
  };
}
