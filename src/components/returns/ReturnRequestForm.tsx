"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { lookupOrderForReturnAction, uploadReturnPhotoAction, requestReturnAction } from "@/app/actions/returns";
import { RETURN_REASON_LABELS, ReturnReason } from "@/lib/enums";
import { formatMoney, cn } from "@/lib/utils";

type OrderItem = { id: string; title: string; variantTitle: string | null; imageUrl: string | null; quantity: number; price: number };
type LookupResult = { orderId: string; orderNumber: number; withinWindow: boolean; daysSince: number; items: OrderItem[] };

const REASONS = Object.values(ReturnReason);

export function ReturnRequestForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Step 1: lookup
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<LookupResult | null>(null);

  // Step 2: request details
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState<string>(ReturnReason.CHANGED_MIND);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState<number | null>(null);

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await lookupOrderForReturnAction({ orderNumber, email });
      if (!res.ok) return setError(res.error);
      setOrder(res);
      setSelected(Object.fromEntries(res.items.map((i) => [i.id, false])));
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files).slice(0, 6 - photos.length)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadReturnPhotoAction(fd);
      if (res.ok) setPhotos((prev) => [...prev, res.url]);
    }
    setUploading(false);
  }

  function submit() {
    if (!order) return;
    setError("");
    const items = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([orderItemId]) => ({ orderItemId, quantity: 1 }));
    if (items.length === 0) return setError("Select at least one item to return.");

    startTransition(async () => {
      const res = await requestReturnAction({ orderId: order.orderId, email, reason, note, items, photoUrls: photos });
      if (!res.ok) return setError(res.error);
      setSubmitted(order.orderNumber);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-panel p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto mb-3 text-forest-700" size={40} />
        <h2 className="text-xl font-bold">Return request submitted</h2>
        <p className="mt-2 text-ink-soft">We&apos;ll review order #{submitted} and email you at {email} within 1-2 business days. Please don&apos;t ship anything back until you receive approval.</p>
        <Link href="/" className="btn btn-primary mt-6">Back to home</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <form onSubmit={lookup} className="mx-auto max-w-md rounded-2xl bg-panel p-6 shadow-card">
        <label className="label">Order number</label>
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. 1001" className="input" />
        <label className="label mt-4">Email used at checkout</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="input" />
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
          {pending ? <Loader2 className="animate-spin" size={16} /> : "Find my order"}
        </button>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-panel p-6 shadow-card">
      <h2 className="text-lg font-bold">Order #{order.orderNumber}</h2>

      {!order.withinWindow && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-600">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          This order is {order.daysSince} days old, outside our 21-day return window. You can still submit a request — defective or damaged items may be reviewed at our discretion — but standard changed-mind returns won&apos;t be eligible.
        </p>
      )}

      {order.items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">Every item on this order already has a return request in progress.</p>
      ) : (
        <>
          <p className="label mt-5">Which item(s) are you returning?</p>
          <div className="space-y-2">
            {order.items.map((i) => (
              <label key={i.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5", selected[i.id] ? "border-forest-700 ring-1 ring-forest-700" : "border-cream-dark")}>
                <input type="checkbox" checked={!!selected[i.id]} onChange={(e) => setSelected((s) => ({ ...s, [i.id]: e.target.checked }))} className="accent-forest-700" />
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-ink">{i.title}</p>
                  {i.variantTitle && <p className="text-ink-soft">{i.variantTitle}</p>}
                </div>
                <span className="text-sm font-medium">{formatMoney(i.price)}</span>
              </label>
            ))}
          </div>

          <label className="label mt-5">Reason for return</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="input">
            {REASONS.map((r) => (
              <option key={r} value={r}>{RETURN_REASON_LABELS[r]}</option>
            ))}
          </select>

          <label className="label mt-4">Tell us more</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Describe the issue — the more detail, the faster we can approve it." className="input" />

          <p className="label mt-4">Photos {reason !== ReturnReason.WRONG_ITEM && <span className="text-red-500">(required)</span>}</p>
          <p className="mb-2 text-xs text-ink-soft">Show us the paddle&apos;s current condition, including the face and edge guard.</p>
          <div className="flex flex-wrap gap-3">
            {photos.map((url, i) => (
              <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg bg-cream">
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                <button type="button" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white">
                  <X size={11} />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-cream-dark text-ink-soft hover:border-forest-400">
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
              </label>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          <button onClick={submit} disabled={pending || uploading} className="btn btn-primary mt-6 w-full">
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Submit return request"}
          </button>
        </>
      )}
    </div>
  );
}
