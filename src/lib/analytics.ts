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
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to }, sessionId: { not: null } },
  });
  return rows.length;
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

/** Session duration, bounce rate, pages per session. */
export async function getSessionMetrics(range: DateRange) {
  const events = await prisma.analyticsEvent.findMany({
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
    select: { sessionId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

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

/** Top pages by views. */
export async function getTopPages(range: DateRange, limit = 8) {
  const events = await prisma.analyticsEvent.findMany({
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
    select: { path: true },
  });

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
      if (domain.includes("google")) return "Google";
      if (domain.includes("facebook")) return "Facebook";
      if (domain.includes("instagram")) return "Instagram";
      if (domain.includes("twitter") || domain.includes("x.com")) return "Twitter/X";
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

/** Traffic sources including direct, organic, referral, social, etc. */
export async function getDetailedTrafficSources(range: DateRange) {
  const events = await prisma.analyticsEvent.findMany({
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
    select: { utmSource: true, referrer: true },
  });

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
}

/** Every session in range, newest first, with full timing/device/conversion detail. */
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
    const meta = pageViews[0] ? safeJson<{ device?: string; browser?: string; os?: string }>(pageViews[0].metaJson, {}) : {};
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
