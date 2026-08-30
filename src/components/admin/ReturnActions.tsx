"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, PackageCheck, RotateCcw, Loader2 } from "lucide-react";
import { approveReturnAction, denyReturnAction, markReturnReceivedAction, refundReturnAction } from "@/app/actions/admin/returns";
import { formatMoney } from "@/lib/utils";

export function ReturnActions({ ret }: { ret: { id: string; status: string; orderTotal: number; refundedTotal: number } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | "approve" | "deny" | "refund">(null);
  const [note, setNote] = useState("");
  const refundable = ret.orderTotal - ret.refundedTotal;
  const [refundAmt, setRefundAmt] = useState(refundable.toFixed(2));
  const [restock, setRestock] = useState(false);
  const [msg, setMsg] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg("");
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setMsg(res.error ?? "Error");
      else {
        setModal(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ret.status === "requested" && (
          <>
            <button onClick={() => setModal("approve")} className="btn btn-primary text-sm"><CheckCircle2 size={16} /> Approve</button>
            <button onClick={() => setModal("deny")} className="btn btn-ghost text-sm text-red-600"><XCircle size={16} /> Deny</button>
          </>
        )}
        {ret.status === "approved" && (
          <button onClick={() => run(() => markReturnReceivedAction(ret.id))} className="btn btn-outline text-sm"><PackageCheck size={16} /> Mark item received</button>
        )}
        {(ret.status === "received" || ret.status === "approved") && refundable > 0 && (
          <button onClick={() => setModal("refund")} className="btn btn-primary text-sm"><RotateCcw size={16} /> Refund</button>
        )}
      </div>
      {msg && <p className="text-sm text-red-500">{msg}</p>}

      {modal === "approve" && (
        <Modal title="Approve return" onClose={() => setModal(null)}>
          <p className="text-sm text-ink-soft">The customer will be emailed and asked to ship the item back.</p>
          <label className="label mt-3">Note to customer (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" placeholder="e.g. Return shipping instructions" />
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <button onClick={() => run(() => approveReturnAction(ret.id, note))} disabled={pending} className="btn btn-primary mt-4 w-full">
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Approve return"}
          </button>
        </Modal>
      )}

      {modal === "deny" && (
        <Modal title="Deny return" onClose={() => setModal(null)}>
          <label className="label">Reason (sent to customer)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" placeholder="e.g. Paddle shows play wear and isn't eligible for a refund per our return policy." />
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <button onClick={() => run(() => denyReturnAction(ret.id, note))} disabled={pending} className="btn mt-4 w-full bg-red-600 text-white hover:bg-red-700">
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Deny return"}
          </button>
        </Modal>
      )}

      {modal === "refund" && (
        <Modal title="Refund order" onClose={() => setModal(null)}>
          <p className="text-sm text-ink-soft">Available to refund: <strong>{formatMoney(refundable)}</strong></p>
          <label className="label mt-3">Amount</label>
          <input type="number" step="0.01" max={refundable} value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} className="input" />
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="accent-forest-700" /> Restock item (only if unused/resellable)</label>
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <button onClick={() => run(() => refundReturnAction(ret.id, parseFloat(refundAmt), restock))} disabled={pending} className="btn btn-primary mt-4 w-full">
            {pending ? <Loader2 className="animate-spin" size={16} /> : `Refund ${formatMoney(parseFloat(refundAmt) || 0)}`}
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
