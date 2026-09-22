"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";
import { parseUserAgent, detectBot } from "@/lib/user-agent";

const schema = z.object({
  path: z.string().max(500),
  sessionId: z.string().max(100),
  referrer: z.string().max(500).optional().nullable(),
  utmSource: z.string().max(100).optional().nullable(),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
  landing: z
    .object({
      landingUrl: z.string().max(2000),
      language: z.string().max(50),
      timezone: z.string().max(100),
      screen: z.string().max(20),
      viewport: z.string().max(20),
    })
    .partial()
    .optional(),
});

/** Records a storefront page view. Called by the client-side tracker on every route change. */
export async function trackPageViewAction(raw: unknown) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { path, sessionId, referrer, utmSource, utmMedium, utmCampaign, landing } = parsed.data;

  const h = await headers();
  const ua = h.get("user-agent");
  const { device, browser, os } = parseUserAgent(ua);
  const { isBot, botName } = detectBot(ua);

  // Approximate location from Vercel's edge geo headers (city-level, from IP;
  // the raw IP itself is deliberately not stored).
  const decode = (v: string | null) => (v ? decodeURIComponent(v) : undefined);
  const geo = landing
    ? {
        country: decode(h.get("x-vercel-ip-country")),
        region: decode(h.get("x-vercel-ip-country-region")),
        city: decode(h.get("x-vercel-ip-city")),
      }
    : undefined;

  await prisma.analyticsEvent
    .create({
      data: {
        type: AnalyticsEventType.PAGE_VIEW,
        sessionId,
        path,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        metaJson: JSON.stringify({ device, browser, os, isBot, botName, userAgent: landing ? ua : undefined, ...(landing ?? {}), ...(geo ?? {}) }),
      },
    })
    .catch(() => {});

  return { ok: true };
}
