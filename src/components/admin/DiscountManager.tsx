"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { createDiscountAction, toggleDiscountAction, deleteDiscountAction } from "@/app/actions/admin/misc";
import { Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatMoney } from "@/lib/utils";

interface Discount {
  id: string; code: string; type: string; value: number; status: string;
  minSubtotal: number | null; usageCount: number; usageLimit: number | null; endsAt: string | null;
}

export function DiscountManager({ discounts }: { discounts: Discount[] }) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [type, setType] = useState("percentage");

  function describe(d: Discount) {
    if (d.type === "percentage") return `${d.value}% off`;
    if (d.type === "fixed_amount") return `${formatMoney(d.value)} off`;
    return "Free shipping";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createDiscountAction({
        code: String(fd.get("code")),
        type: String(fd.get("type")),
        value: parseFloat(String(fd.get("value")) || "0"),
        minSubtotal: fd.get("minSubtotal") ? parseFloat(String(fd.get("minSubtotal"))) : null,
        usageLimit: fd.get("usageLimit") ? parseInt(String(fd.get("usageLimit"))) : null,
        endsAt: String(fd.get("endsAt")) || null,
      });
      if (!res.ok) return setError(res.error ?? "Error");
      setShowForm(false);
    });
  }

  return (
    <div className="space-y-6">
      <button onClick={() => setShowForm((v) => !v)} className="btn btn-primary text-sm"><Plus size={16} /> Create discount</button>

      {showForm && (
        <Card>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Code</label><input name="code" required placeholder="SUMMER20" className="input uppercase" /></div>
            <div><label className="label">Type</label>
              <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="input">
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
            {type !== "free_shipping" && (
              <div><label className="label">{type === "percentage" ? "Percent off" : "Amount off ($)"}</label><input name="value" type="number" step="0.01" required className="input" /></div>
            )}
            <div><label className="label">Min. subtotal ($, optional)</label><input name="minSubtotal" type="number" step="0.01" className="input" /></div>
            <div><label className="label">Usage limit (optional)</label><input name="usageLimit" type="number" className="input" /></div>
            <div><label className="label">Expires (optional)</label><input name="endsAt" type="date" className="input" /></div>
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><button type="submit" disabled={pending} className="btn btn-primary">{pending ? <Loader2 className="animate-spin" size={16} /> : "Create"}</button></div>
          </form>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-cream-dark text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-cream-dark">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-cream/50">
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 font-semibold"><Tag size={14} className="text-forest-600" />{d.code}</span></td>
                <td className="px-4 py-3">{describe(d)}{d.minSubtotal ? ` · min ${formatMoney(d.minSubtotal)}` : ""}</td>
                <td className="px-4 py-3">{d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ""}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startTransition(() => toggleDiscountAction(d.id, d.status === "active" ? "disabled" : "active").then(() => {}))} className="text-xs font-semibold text-forest-700 hover:underline">
                      {d.status === "active" ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => { if (confirm("Delete code?")) startTransition(() => deleteDiscountAction(d.id).then(() => {})); }} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">No discount codes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
