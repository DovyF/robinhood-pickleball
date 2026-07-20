"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";
import { US_STATES } from "@/lib/us-states";
import { addAddressAction, deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string | null;
  isDefault: boolean;
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const data = {
      firstName: String(fd.get("firstName")),
      lastName: String(fd.get("lastName")),
      line1: String(fd.get("line1")),
      line2: String(fd.get("line2") || ""),
      city: String(fd.get("city")),
      state: String(fd.get("state")),
      postalCode: String(fd.get("postalCode")),
      phone: String(fd.get("phone") || ""),
      isDefault: fd.get("isDefault") === "on",
    };
    startTransition(async () => {
      const res = await addAddressAction(data);
      if (!res.ok) return setError(res.error ?? "Error");
      setShowForm(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Saved addresses</h2>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-outline !py-2 text-sm">
          <Plus size={16} /> Add address
        </button>
      </div>

      {addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="relative rounded-2xl bg-panel p-5 shadow-card">
              {a.isDefault && <span className="absolute right-4 top-4 rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-700">Default</span>}
              <p className="font-semibold">{a.firstName} {a.lastName}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                {a.city}, {a.state} {a.postalCode}
                {a.phone ? <><br />{a.phone}</> : null}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                {!a.isDefault && (
                  <button onClick={() => startTransition(() => setDefaultAddressAction(a.id).then(() => {}))} className="inline-flex items-center gap-1 text-forest-700 hover:underline">
                    <Star size={14} /> Set default
                  </button>
                )}
                <button onClick={() => startTransition(() => deleteAddressAction(a.id).then(() => {}))} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl bg-panel p-5 shadow-card">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="firstName" required placeholder="First name" className="input" />
            <input name="lastName" required placeholder="Last name" className="input" />
          </div>
          <input name="line1" required placeholder="Address" className="input mt-3" />
          <input name="line2" placeholder="Apt, suite (optional)" className="input mt-3" />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input name="city" required placeholder="City" className="input" />
            <select name="state" required className="input" defaultValue="">
              <option value="">State</option>
              {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <input name="postalCode" required placeholder="ZIP" className="input" />
          </div>
          <input name="phone" placeholder="Phone (optional)" className="input mt-3" />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDefault" className="accent-forest-700" /> Set as default address
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary mt-4">
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Save address"}
          </button>
        </form>
      )}
    </div>
  );
}
