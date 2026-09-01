"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";
import { parseUserAgent } from "@/lib/user-agent";

const schema = z.object({
  path: z.string().max(500),
  sessionId: z.string().max(100),
  referrer: z.string().max(500).optional().nullable(),
  utmSource: z.string().max(100).optional().nullable(),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
});

/** Records a storefront page view. Called by the client-side tracker on every route change. */
export async function trackPageViewAction(raw: unknown) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { path, sessionId, referrer, utmSource, utmMedium, utmCampaign } = parsed.data;

  const h = await headers();
  const ua = h.get("user-agent");
  const { device, browser, os } = parseUserAgent(ua);

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
        metaJson: JSON.stringify({ device, browser, os }),
      },
    })
    .catch(() => {});

  return { ok: true };
}
