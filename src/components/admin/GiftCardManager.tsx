"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Gift } from "lucide-react";
import { createGiftCardAction } from "@/app/actions/admin/misc";
import { Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatMoney } from "@/lib/utils";

interface GC { id: string; code: string; initialValue: number; balance: number; status: string; recipientEmail: string | null; }

export function GiftCardManager({ cards }: { cards: GC[] }) {
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createGiftCardAction({ value: parseFloat(String(fd.get("value")) || "0"), recipientEmail: String(fd.get("email")) || undefined });
      setShow(false);
    });
  }

  return (
    <div className="space-y-6">
      <button onClick={() => setShow((v) => !v)} className="btn btn-primary text-sm"><Plus size={16} /> Issue gift card</button>
      {show && (
        <Card>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Amount ($)</label><input name="value" type="number" step="0.01" required className="input" /></div>
            <div><label className="label">Recipient email (optional)</label><input name="email" type="email" className="input" /></div>
            <div className="sm:col-span-2"><button type="submit" disabled={pending} className="btn btn-primary">{pending ? <Loader2 className="animate-spin" size={16} /> : "Create gift card"}</button></div>
          </form>
        </Card>
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-cream-dark text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3">Code</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Initial</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-cream-dark">
            {cards.map((c) => (
              <tr key={c.id} className="hover:bg-cream/50">
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold"><Gift size={14} className="text-forest-600" />{c.code}</span></td>
                <td className="px-4 py-3 font-semibold">{formatMoney(c.balance)}</td>
                <td className="px-4 py-3 text-ink-soft">{formatMoney(c.initialValue)}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
            {cards.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-soft">No gift cards issued yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
