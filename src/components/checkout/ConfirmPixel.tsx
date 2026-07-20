"use client";

import { useEffect } from "react";

/** Fires purchase conversion events to configured pixels once on mount. */
export function ConfirmPixel({ value, orderNumber }: { value: number; orderNumber: number }) {
  useEffect(() => {
    const w = window as unknown as {
      fbq?: (...a: unknown[]) => void;
      gtag?: (...a: unknown[]) => void;
      ttq?: { track: (...a: unknown[]) => void };
    };
    w.fbq?.("track", "Purchase", { value, currency: "USD" });
    w.gtag?.("event", "purchase", { transaction_id: String(orderNumber), value, currency: "USD" });
    w.ttq?.track("CompletePayment", { value, currency: "USD" });
  }, [value, orderNumber]);
  return null;
}
