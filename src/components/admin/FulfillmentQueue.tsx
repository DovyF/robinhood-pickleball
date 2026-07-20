"use client";

import { useState } from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "./ui";
import { formatMoney, formatDate, safeJson } from "@/lib/utils";
import { Printer, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { CheckoutAddress } from "@/lib/orders";
import type { OrderWithItems } from "@/types/orders";
import { generatePirateShipLabel, fulfillOrdersAction } from "@/app/actions/admin/fulfillment";

export function FulfillmentQueue({ orders }: { orders: OrderWithItems[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

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

  const generateLabels = async () => {
    if (selected.size === 0) {
      setMsg("Select orders to generate labels");
      return;
    }

    setLoading(true);
    setMsg("");
    setSuccess(false);

    const selectedOrders = orders.filter((o) => selected.has(o.id));

    try {
      const result = await generatePirateShipLabel(selectedOrders);
      if (result.ok) {
        setSuccess(true);
        setMsg(`✓ Generated ${result.labels?.length || 0} PirateShip labels`);
        setSelected(new Set());
      } else {
        setMsg(result.error || "Failed to generate labels");
      }
    } catch (err) {
      setMsg("Error generating labels");
    } finally {
      setLoading(false);
    }
  };

  const fulfillSelected = async () => {
    if (selected.size === 0) {
      setMsg("Select orders to fulfill");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const result = await fulfillOrdersAction(Array.from(selected));
      if (result.ok) {
        setSuccess(true);
        setMsg(`✓ Fulfilled ${result.count} orders`);
        setSelected(new Set());
      } else {
        setMsg(result.error || "Failed to fulfill orders");
      }
    } catch (err) {
      setMsg("Error fulfilling orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selected.size === orders.length && orders.length > 0}
              onCheckedChange={selectAll}
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
              onClick={generateLabels}
              disabled={selected.size === 0 || loading}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Printer size={16} />
              )}
              Generate Labels
            </button>
            <button
              onClick={fulfillSelected}
              disabled={selected.size === 0 || loading}
              className="btn btn-outline text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Mark Fulfilled
            </button>
          </div>
        </div>
      </Card>

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
                  onCheckedChange={() => toggleOrder(order.id)}
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
                    {order.items.slice(0, 3).map((item) => (
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
                            className="object-cover"
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
