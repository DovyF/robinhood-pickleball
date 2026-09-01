"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";

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
      },
    })
    .catch(() => {});

  return { ok: true };
}
