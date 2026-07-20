import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export function rangeFromParam(param?: string): DateRange {
  const to = new Date();
  const days = param === "7d" ? 7 : param === "90d" ? 90 : param === "12m" ? 365 : 30;
  return { from: startOfDay(subDays(to, days - 1)), to };
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
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } } }),
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
  const [views, productViews, addToCart, checkout, purchase] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "product_view", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "add_to_cart", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "begin_checkout", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.analyticsEvent.count({ where: { type: "purchase", createdAt: { gte: range.from, lte: range.to } } }),
  ]);
  return [
    { stage: "Sessions", count: views },
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

/** Traffic sources including direct, organic, referral, social, etc. */
export async function getDetailedTrafficSources(range: DateRange) {
  const events = await prisma.analyticsEvent.findMany({
    where: { type: "page_view", createdAt: { gte: range.from, lte: range.to } },
    select: { utmSource: true, referrer: true },
  });

  const sources = new Map<string, number>();
  for (const e of events) {
    let source = "Direct";
    if (e.utmSource) {
      source = e.utmSource.charAt(0).toUpperCase() + e.utmSource.slice(1);
    } else if (e.referrer) {
      try {
        const url = new URL(e.referrer);
        const domain = url.hostname.replace("www.", "");
        if (domain.includes("google")) source = "Google";
        else if (domain.includes("facebook")) source = "Facebook";
        else if (domain.includes("instagram")) source = "Instagram";
        else if (domain.includes("twitter") || domain.includes("x.com")) source = "Twitter/X";
        else if (domain.includes("pinterest")) source = "Pinterest";
        else if (domain.includes("reddit")) source = "Reddit";
        else if (domain.includes("tiktok")) source = "TikTok";
        else source = domain;
      } catch {
        source = "Referral";
      }
    }
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  const total = Array.from(sources.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(sources.entries())
    .map(([source, count]) => ({ source, visits: count, pct: (count / total) * 100 }))
    .sort((a, b) => b.visits - a.visits);
}
