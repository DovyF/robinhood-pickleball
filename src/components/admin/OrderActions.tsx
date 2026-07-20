"use client";

import { useState, useTransition } from "react";
import { Truck, RotateCcw, Loader2, Printer, XCircle, CheckCircle2 } from "lucide-react";
import { fulfillOrderAction, refundOrderAction, updateTrackingAction, cancelOrderAction, markPaidManuallyAction } from "@/app/actions/admin/orders";
import { formatMoney } from "@/lib/utils";

export function OrderActions({ order }: { order: { id: string; orderNumber: number; total: number; refundedTotal: number; paymentStatus: string; fulfillmentStatus: string; carrier?: string | null; trackingNumber?: string | null } }) {
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | "fulfill" | "refund" | "cancel">(null);
  const [carrier, setCarrier] = useState(order.carrier ?? "USPS");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [notify, setNotify] = useState(true);
  const [refundAmt, setRefundAmt] = useState((order.total - order.refundedTotal).toFixed(2));
  const [refundReason, setRefundReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [msg, setMsg] = useState("");

  const refundable = order.total - order.refundedTotal;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg("");
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setMsg(res.error ?? "Error");
      else setModal(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {order.paymentStatus !== "paid" && (
          <button onClick={() => run(() => markPaidManuallyAction(order.id))} className="btn btn-outline text-sm"><CheckCircle2 size={16} /> Mark as paid</button>
        )}
        {order.fulfillmentStatus !== "fulfilled" && (
          <button onClick={() => setModal("fulfill")} className="btn btn-primary text-sm"><Truck size={16} /> Fulfill & ship</button>
        )}
        {refundable > 0 && order.paymentStatus === "paid" && (
          <button onClick={() => setModal("refund")} className="btn btn-outline text-sm"><RotateCcw size={16} /> Refund</button>
        )}
        <a href={`/admin/orders/${order.id}/packing-slip`} target="_blank" className="btn btn-ghost text-sm"><Printer size={16} /> Packing slip</a>
        <button onClick={() => setModal("cancel")} className="btn btn-ghost text-sm text-red-600"><XCircle size={16} /> Cancel</button>
      </div>

      {modal === "fulfill" && (
        <Modal title="Fulfill order" onClose={() => setModal(null)}>
          <label className="label">Carrier</label>
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="input">
            <option>USPS</option><option>UPS</option><option>FedEx</option>
          </select>
          <label className="label mt-3">Tracking number</label>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 9400 1000 0000 0000 0000 00" className="input" />
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-forest-700" /> Email customer shipping notification</label>
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <button onClick={() => run(() => fulfillOrderAction({ orderId: order.id, carrier, trackingNumber: tracking, notify }))} disabled={pending} className="btn btn-primary mt-4 w-full">
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Mark as fulfilled"}
          </button>
        </Modal>
      )}

      {modal === "refund" && (
        <Modal title="Refund order" onClose={() => setModal(null)}>
          <p className="text-sm text-ink-soft">Available to refund: <strong>{formatMoney(refundable)}</strong></p>
          <label className="label mt-3">Amount</label>
          <input type="number" step="0.01" max={refundable} value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} className="input" />
          <label className="label mt-3">Reason</label>
          <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="input" />
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="accent-forest-700" /> Restock items</label>
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <button onClick={() => run(() => refundOrderAction({ orderId: order.id, amount: parseFloat(refundAmt), reason: refundReason, restock }))} disabled={pending} className="btn btn-primary mt-4 w-full">
            {pending ? <Loader2 className="animate-spin" size={16} /> : `Refund ${formatMoney(parseFloat(refundAmt) || 0)}`}
          </button>
        </Modal>
      )}

      {modal === "cancel" && (
        <Modal title="Cancel order" onClose={() => setModal(null)}>
          <label className="label">Reason</label>
          <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input" />
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <button onClick={() => run(() => cancelOrderAction(order.id, cancelReason))} disabled={pending} className="btn mt-4 w-full bg-red-600 text-white hover:bg-red-700">
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Cancel order"}
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
