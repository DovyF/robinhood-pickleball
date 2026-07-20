import { round2 } from "@/lib/utils";

// Sales tax calculation.
// Default: destination-based US state rates (approximate combined state+avg local).
// If TAXJAR_API_KEY is set, callers may swap in the TaxJar API for exact rates.
// Rates are intentionally editable from the admin Settings → Tax page.

const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.0924, AK: 0.0176, AZ: 0.0840, AR: 0.0947, CA: 0.0882, CO: 0.0777,
  CT: 0.0635, DE: 0.0, FL: 0.0701, GA: 0.0735, HI: 0.0444, ID: 0.0603,
  IL: 0.0882, IN: 0.0700, IA: 0.0694, KS: 0.0869, KY: 0.0600, LA: 0.0955,
  ME: 0.0550, MD: 0.0600, MA: 0.0625, MI: 0.0600, MN: 0.0749, MS: 0.0707,
  MO: 0.0829, MT: 0.0, NE: 0.0694, NV: 0.0823, NH: 0.0, NJ: 0.0660,
  NM: 0.0778, NY: 0.0852, NC: 0.0698, ND: 0.0696, OH: 0.0723, OK: 0.0895,
  OR: 0.0, PA: 0.0634, RI: 0.0700, SC: 0.0744, SD: 0.0640, TN: 0.0955,
  TX: 0.0820, UT: 0.0719, VT: 0.0624, VA: 0.0573, WA: 0.0929, WV: 0.0655,
  WI: 0.0543, WY: 0.0522, DC: 0.0600,
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
