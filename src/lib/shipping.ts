import { round2 } from "@/lib/utils";

// Shipping rate calculation.
// Ships in two modes:
//   1. Live USPS rates (Ground Advantage + Priority) when USPS creds + ship-from
//      ZIP are configured — calculated per destination ZIP. See lib/carriers/usps.
//   2. Flat-rate fallback (no external accounts needed) so checkout always works.

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  label: string;
  amount: number;
  estDeliveryDays?: number;
}

export interface ShippingInput {
  subtotal: number;
  totalWeightGrams: number;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
}

// No free-shipping promotion. Set FREE_SHIPPING_THRESHOLD in the env only if
// the business decides to offer one; by default nothing ships free.
const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD ?? Infinity);

// Flat-rate fallback used when USPS live rates aren't available (no creds, or
// the API failed). Mirrors typical USPS pricing for the Longbow's mailer so
// checkout still works and never overcharges wildly.
export function getFlatRates(): ShippingRate[] {
  const qualifiesFree = 0 >= FREE_SHIPPING_THRESHOLD; // effectively never free by default
  const ground: ShippingRate = {
    id: "usps_ground",
    carrier: "USPS",
    service: "Ground Advantage",
    label: "USPS Ground Advantage (2–5 business days)",
    amount: qualifiesFree ? 0 : 6.95,
    estDeliveryDays: 4,
  };
  const priority: ShippingRate = {
    id: "usps_priority",
    carrier: "USPS",
    service: "Priority Mail",
    label: "USPS Priority Mail (1–3 business days)",
    amount: 11.95,
    estDeliveryDays: 2,
  };
  return [ground, priority].map((r) => ({ ...r, amount: round2(r.amount) }));
}

/**
 * Returns available shipping rates. Prefers live USPS rates (calculated to the
 * destination ZIP) when configured; falls back to flat rates on any error so
 * checkout is never blocked.
 */
export async function getShippingRates(input: ShippingInput): Promise<ShippingRate[]> {
  const { uspsConfigured, getUspsRates } = await import("@/lib/carriers/usps");
  if (uspsConfigured() && input.postalCode) {
    try {
      const live = await getUspsRates(input.postalCode, input.totalWeightGrams);
      if (live.length) return live;
    } catch {
      // fall through to flat rates on any carrier error
    }
  }
  return getFlatRates();
}

export const freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
