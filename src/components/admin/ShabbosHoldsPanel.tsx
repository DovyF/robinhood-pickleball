"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { captureShabbosHoldsNowAction } from "@/app/actions/admin/shabbos";
import { Card, EmptyState } from "@/components/admin/ui";
import { formatMoney } from "@/lib/utils";

interface HeldOrder { id: string; orderNumber: number; email: string; total: number; captureAfter: string | null; }

export function ShabbosHoldsPanel({ orders }: { orders: HeldOrder[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ captured: number; checked: number } | null>(null);

  function captureNow() {
    setResult(null);
    startTransition(async () => {
      const res = await captureShabbosHoldsNowAction();
      setResult(res);
    });
  }

  return (
    <Card
      title="Currently held (authorized, not charged)"
      action={
        <button onClick={captureNow} disabled={pending} className="btn btn-ghost text-xs">
          {pending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} Capture due holds now
        </button>
      }
    >
      {result && (
        <p className="mb-3 text-sm text-forest-600">
          Captured {result.captured} of {result.checked} order{result.checked === 1 ? "" : "s"} that were past their capture time.
        </p>
      )}
      {orders.length === 0 ? (
        <EmptyState title="No held orders" subtitle="Orders placed during Shabbos will show up here until they're captured." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-ink-soft"><th className="pb-2">Order</th><th className="pb-2">Customer</th><th className="pb-2 text-right">Amount</th><th className="pb-2 text-right">Captures at</th></tr></thead>
          <tbody>
            {orders.map((o) => {
              const due = o.captureAfter ? new Date(o.captureAfter) <= new Date() : false;
              return (
                <tr key={o.id} className="border-t border-cream-dark">
                  <td className="py-2 font-medium">#{o.orderNumber}</td>
                  <td className="py-2 text-ink-soft">{o.email}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(o.total)}</td>
                  <td className={`py-2 text-right ${due ? "font-semibold text-forest-600" : "text-ink-soft"}`}>
                    {o.captureAfter ? new Date(o.captureAfter).toLocaleString() : "—"}{due ? " (due)" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
