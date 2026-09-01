"use client";

import { useState } from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "./ui";
import { formatMoney, formatDate, safeJson } from "@/lib/utils";
import { Download, Loader2, CheckCircle2, AlertCircle, Truck } from "lucide-react";
import type { CheckoutAddress } from "@/lib/orders";
import { exportOrdersForPirateShip } from "@/app/actions/admin/fulfillment";
import { fulfillOrderAction } from "@/app/actions/admin/orders";

interface TrackingRow { carrier: string; tracking: string; }

export function FulfillmentQueue({ orders }: { orders: any[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, TrackingRow>>({});
  const [notify, setNotify] = useState(true);

  const toggleOrder = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o.id)));
  };

  const exportCsv = async () => {
    if (selected.size === 0) {
      setMsg("Select orders to export");
      return;
    }

    setLoading(true);
    setMsg("");
    setSuccess(false);

    const selectedOrders = orders.filter((o) => selected.has(o.id));

    try {
      const result = await exportOrdersForPirateShip(selectedOrders);
      if (result.ok) {
        const blob = new Blob([result.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pirateship-import-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess(true);
        setMsg(`✓ Exported ${selectedOrders.length} orders — upload this file at pirateship.com/orders`);
      } else {
        setMsg("Failed to export orders");
      }
    } catch (err) {
      setMsg("Error exporting orders");
    } finally {
      setLoading(false);
    }
  };

  const openFulfillModal = () => {
    if (selected.size === 0) {
      setMsg("Select orders to fulfill");
      return;
    }
    setMsg("");
    setRows(Object.fromEntries(Array.from(selected).map((id) => [id, { carrier: "USPS", tracking: "" }])));
    setModalOpen(true);
  };

  const submitFulfillment = async () => {
    setLoading(true);
    setMsg("");
    const ids = Array.from(selected);
    const results = await Promise.all(
      ids.map((id) => fulfillOrderAction({ orderId: id, carrier: rows[id].carrier, trackingNumber: rows[id].tracking, notify }))
    );
    const failed = results.filter((r) => !r.ok).length;
    setLoading(false);
    setModalOpen(false);
    if (failed === 0) {
      setSuccess(true);
      setMsg(`✓ Fulfilled ${ids.length} order${ids.length !== 1 ? "s" : ""}${notify ? " and notified customers" : ""}`);
      setSelected(new Set());
    } else {
      setSuccess(false);
      setMsg(`${ids.length - failed} fulfilled, ${failed} failed — check those orders individually`);
    }
  };

  const selectedOrders = orders.filter((o) => selected.has(o.id));

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Pirate Ship doesn't offer an API, so labels can't be bought automatically — select orders below, export a CSV, then upload it at{" "}
        <a href="https://ship.pirateship.com/orders/import" target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">pirateship.com</a> to buy discounted USPS/UPS labels in bulk. Once you have tracking numbers, come back and mark them fulfilled below.
      </p>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selected.size === orders.length && orders.length > 0}
              onChange={selectAll}
            />
            <span className="text-sm font-medium text-ink-soft">
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select orders to fulfill"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {msg && (
              <div className={`text-sm flex items-center gap-1 ${success ? "text-forest-400" : "text-red-500"}`}>
                {success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {msg}
              </div>
            )}
            <button
              onClick={exportCsv}
              disabled={selected.size === 0 || loading}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Download size={16} />
              )}
              Export for Pirate Ship
            </button>
            <button
              onClick={openFulfillModal}
              disabled={selected.size === 0 || loading}
              className="btn btn-outline text-sm disabled:opacity-50"
            >
              <Truck size={16} />
              Fulfill & ship
            </button>
          </div>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => !loading && setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-bold">Fulfill {selectedOrders.length} order{selectedOrders.length !== 1 ? "s" : ""}</h3>
            <p className="mb-4 text-sm text-ink-soft">Enter the tracking number Pirate Ship gave you for each order.</p>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {selectedOrders.map((o) => (
                <div key={o.id} className="grid grid-cols-[70px_1fr_1.4fr] gap-2 items-center">
                  <span className="text-sm font-medium text-ink">#{o.orderNumber}</span>
                  <select
                    value={rows[o.id]?.carrier ?? "USPS"}
                    onChange={(e) => setRows((r) => ({ ...r, [o.id]: { ...r[o.id], carrier: e.target.value } }))}
                    className="input !py-1.5 text-sm"
                  >
                    <option>USPS</option><option>UPS</option><option>FedEx</option>
                  </select>
                  <input
                    value={rows[o.id]?.tracking ?? ""}
                    onChange={(e) => setRows((r) => ({ ...r, [o.id]: { ...r[o.id], tracking: e.target.value } }))}
                    placeholder="Tracking number"
                    className="input !py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-forest-700" /> Email customers their shipping notification</label>
            <button onClick={submitFulfillment} disabled={loading} className="btn btn-primary mt-4 w-full">
              {loading ? <Loader2 className="animate-spin" size={16} /> : `Mark ${selectedOrders.length} fulfilled`}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const ship = safeJson<CheckoutAddress | null>(
            order.shippingAddressJson,
            null
          );

          return (
            <Card key={order.id} className="p-4 hover:bg-cream-dark/30 transition">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selected.has(order.id)}
                  onChange={() => toggleOrder(order.id)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-ink">
                      Order #{order.orderNumber}
                    </h3>
                    <span className="text-sm text-ink-soft">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-ink-soft mb-2">{order.email}</p>

                  <div className="flex items-center gap-2 mb-3">
                    {order.items.slice(0, 3).map((item: any) => (
                      <div
                        key={item.id}
                        className="relative h-10 w-10 rounded-lg bg-cream-dark overflow-hidden"
                      >
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-ink-soft ml-1">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-ink-soft">
                      Ship to: {ship ? `${ship.city}, ${ship.state}` : "N/A"}
                    </div>
                    <div className="font-semibold text-gold-300">
                      {formatMoney(order.total)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
