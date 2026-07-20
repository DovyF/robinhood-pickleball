import type { ShippingRate } from "@/lib/shipping";

/**
 * Live USPS rates via the USPS APIs (developer.usps.com — "Domestic Prices 3.0").
 *
 * Setup (env):
 *   USPS_CLIENT_ID       — OAuth consumer key
 *   USPS_CLIENT_SECRET   — OAuth consumer secret
 *   SHIP_FROM_ZIP        — the ZIP you ship the paddle from
 *   USPS_API_BASE        — optional; defaults to production https://apis.usps.com
 *
 * Package is fixed to the Longbow's mailer (15×12×4 in). Weight comes from the
 * cart (paddle + packaging buffer). Returns Ground Advantage + Priority Mail.
 *
 * Some price-request fields (rateIndicator/processingCategory) can need tuning
 * against live API responses; on any error we return [] to trigger the flat-rate
 * fallback in shipping.ts, so checkout never breaks.
 */

const BASE = process.env.USPS_API_BASE || "https://apis.usps.com";
const BOX = { length: 15, width: 12, height: 4 }; // inches
const PACKAGING_GRAMS = 113; // ~4 oz of box + wrap on top of the paddle

export function uspsConfigured(): boolean {
  return Boolean(process.env.USPS_CLIENT_ID && process.env.USPS_CLIENT_SECRET && process.env.SHIP_FROM_ZIP);
}

// ---- OAuth token (cached in-memory until shortly before expiry) ----
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;
  const res = await fetch(`${BASE}/oauth2/v3/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.USPS_CLIENT_ID,
      client_secret: process.env.USPS_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`USPS token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function priceFor(mailClass: string, token: string, destZip: string, weightLb: number): Promise<number | null> {
  const res = await fetch(`${BASE}/prices/v3/base-rates/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      originZIPCode: process.env.SHIP_FROM_ZIP,
      destinationZIPCode: destZip,
      weight: Number(weightLb.toFixed(2)),
      length: BOX.length,
      width: BOX.width,
      height: BOX.height,
      mailClass,
      processingCategory: "MACHINABLE",
      rateIndicator: "SP",
      destinationEntryFacilityType: "NONE",
      priceType: "RETAIL",
      mailingDate: today(),
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { totalBasePrice?: number; rates?: { price?: number }[] };
  const price = data.totalBasePrice ?? data.rates?.[0]?.price;
  return typeof price === "number" ? price : null;
}

export async function getUspsRates(destZip: string, totalWeightGrams: number): Promise<ShippingRate[]> {
  const weightLb = Math.max(0.1, (totalWeightGrams + PACKAGING_GRAMS) / 453.592);
  const token = await getToken();

  const services: { id: string; mailClass: string; service: string; label: string; days: number }[] = [
    { id: "usps_ground", mailClass: "USPS_GROUND_ADVANTAGE", service: "Ground Advantage", label: "USPS Ground Advantage (2–5 business days)", days: 4 },
    { id: "usps_priority", mailClass: "PRIORITY_MAIL", service: "Priority Mail", label: "USPS Priority Mail (1–3 business days)", days: 2 },
  ];

  const rates: ShippingRate[] = [];
  for (const s of services) {
    const price = await priceFor(s.mailClass, token, destZip, weightLb);
    if (price != null) {
      rates.push({ id: s.id, carrier: "USPS", service: s.service, label: s.label, amount: Number(price.toFixed(2)), estDeliveryDays: s.days });
    }
  }
  return rates;
}
