"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cancelShabbosHoldAction } from "@/app/actions/checkout";

export function CancelOrderButton({ orderId, token }: { orderId: string; token: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function cancel() {
    startTransition(async () => {
      const res = await cancelShabbosHoldAction(orderId, token);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-forest-700/10 p-4 text-forest-700">
        <CheckCircle2 size={20} /> Your order has been cancelled — no charge will occur.
      </div>
    );
  }

  return (
    <div>
      <button onClick={cancel} disabled={pending} className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
        {pending ? <Loader2 className="animate-spin" size={16} /> : "Cancel this order"}
      </button>
      {result?.error && <p className="mt-3 text-sm text-red-600">{result.error}</p>}
    </div>
  );
}
