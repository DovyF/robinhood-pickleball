import Stripe from "stripe";

// Stripe server client. Initialized lazily so the app boots without a key
// (checkout will surface a friendly error until STRIPE_SECRET_KEY is set).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!_stripe) {
    // Use the SDK's pinned API version (avoids coupling to a hardcoded string).
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
