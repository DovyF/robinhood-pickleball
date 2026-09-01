"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageViewAction } from "@/app/actions/analytics";

const SESSION_MAX_AGE = 60 * 30; // 30 min rolling session, matches typical web-analytics convention

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Fires a page_view analytics event on every route change, generating a rolling
 * 30-min session id and capturing first-touch referrer/UTM params for the session. */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let sessionId = readCookie("rp_sid");
    let touch = readCookie("rp_touch");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      const referrer = document.referrer && new URL(document.referrer).hostname !== window.location.hostname ? document.referrer : "";
      touch = JSON.stringify({
        referrer,
        utmSource: searchParams.get("utm_source") ?? "",
        utmMedium: searchParams.get("utm_medium") ?? "",
        utmCampaign: searchParams.get("utm_campaign") ?? "",
      });
    }

    writeCookie("rp_sid", sessionId, SESSION_MAX_AGE);
    if (touch) writeCookie("rp_touch", touch, SESSION_MAX_AGE);

    const { referrer, utmSource, utmMedium, utmCampaign } = touch ? JSON.parse(touch) : { referrer: "", utmSource: "", utmMedium: "", utmCampaign: "" };

    trackPageViewAction({
      path: pathname,
      sessionId,
      referrer: referrer || undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
