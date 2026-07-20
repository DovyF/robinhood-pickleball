"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";

export function StripePayment({
  publishableKey,
  clientSecret,
  orderId,
  email,
}: {
  publishableKey: string;
  clientSecret: string;
  orderId: string;
  email: string;
}) {
  const stripePromise = loadStripe(publishableKey);
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "flat", variables: { colorPrimary: "#14532d", borderRadius: "10px" } } }}
    >
      <PaymentForm orderId={orderId} email={email} />
    </Elements>
  );
}

function PaymentForm({ orderId, email }: { orderId: string; email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
        receipt_email: email,
      },
    });
    if (error) {
      setError(error.message ?? "Payment failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-cream-dark bg-panel p-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn btn-primary mt-4 w-full disabled:opacity-50">
        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Lock size={16} /> Pay now</>}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
        <Lock size={12} /> Payments are secure and encrypted
      </p>
    </form>
  );
}
