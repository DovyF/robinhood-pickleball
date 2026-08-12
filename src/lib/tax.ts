import { round2 } from "@/lib/utils";

// Sales tax calculation.
// Robinhood Pickleball has sales tax nexus in New York only (confirmed with
// the business owner 2026-08-12) — so tax is charged to NY buyers and $0 to
// everyone else. Collecting tax in states you have no nexus in is a real
// compliance problem (you'd have no permit to remit it), not just a
// customer overcharge — don't re-expand this table without confirming
// nexus in the new state first.
// If TAXJAR_API_KEY is set, callers may swap in the TaxJar API for exact rates.
// Rates are intentionally editable from the admin Settings → Tax page.

const STATE_TAX_RATES: Record<string, number> = {
  NY: 0.0852,
};

export interface TaxInput {
  subtotalAfterDiscount: number;
  shipping: number;
  state?: string | null;
  taxShipping?: boolean;
}

export function calculateTax({ subtotalAfterDiscount, shipping, state, taxShipping = false }: TaxInput): number {
  const rate = state ? STATE_TAX_RATES[state.toUpperCase()] ?? 0 : 0;
  const taxable = subtotalAfterDiscount + (taxShipping ? shipping : 0);
  return round2(taxable * rate);
}

export function taxRateForState(state?: string | null): number {
  return state ? STATE_TAX_RATES[state.toUpperCase()] ?? 0 : 0;
}
