"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { saveShabbosOverrideAction, deleteShabbosOverrideAction } from "@/app/actions/admin/shabbos";
import { Card } from "@/components/admin/ui";

interface Override {
  id: string;
  weekOf: string;
  startsAt: string | null;
  endsAt: string | null;
  zip: string | null;
  note: string | null;
}

const blank = { weekOf: "", startsAt: "", endsAt: "", zip: "", note: "" };

export function ShabbosOverridesManager({ overrides }: { overrides: Override[] }) {
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!form.weekOf) return;
    startTransition(async () => {
      await saveShabbosOverrideAction({
        weekOf: form.weekOf,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        zip: form.zip || null,
        note: form.note || null,
      });
      setForm(blank);
      setShowForm(false);
    });
  }

  return (
    <Card title="Weekly overrides">
      <p className="mb-3 text-xs text-ink-soft">
        Away somewhere else, or making an early Shabbos? Add an override for that specific week — leave start/end blank to keep the calculated time and only override the ZIP (or vice versa).
      </p>
      <button onClick={() => setShowForm((v) => !v)} className="btn btn-primary text-sm"><Plus size={16} /> Add override</button>

      {showForm && (
        <div className="mt-4 grid gap-3 rounded-xl border border-cream-dark p-4 sm:grid-cols-2">
          <div>
            <label className="label">Any date in that week (usually the Friday)</label>
            <input type="date" value={form.weekOf} onChange={(e) => setForm((f) => ({ ...f, weekOf: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Override ZIP (optional — e.g. traveling)</label>
            <input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} className="input" placeholder="Leave blank to use default" />
          </div>
          <div>
            <label className="label">Custom start (optional — early Shabbos)</label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Custom end (optional)</label>
            <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Note (optional, for your own reference)</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input" placeholder="e.g. Away in Miami this week" />
          </div>
          <div className="sm:col-span-2">
            <button onClick={save} disabled={pending || !form.weekOf} className="btn btn-primary">{pending ? <Loader2 className="animate-spin" size={16} /> : "Save override"}</button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {overrides.map((o) => (
          <li key={o.id} className="flex items-center justify-between rounded-lg border border-cream-dark px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-ink">Week of {new Date(o.weekOf).toLocaleDateString()}</p>
              <p className="text-xs text-ink-soft">
                {o.zip ? `ZIP ${o.zip} · ` : ""}
                {o.startsAt ? `starts ${new Date(o.startsAt).toLocaleString()} · ` : ""}
                {o.endsAt ? `ends ${new Date(o.endsAt).toLocaleString()} · ` : ""}
                {o.note}
              </p>
            </div>
            <button onClick={() => startTransition(() => deleteShabbosOverrideAction(o.id).then(() => {}))} className="text-red-500 hover:text-red-400"><Trash2 size={15} /></button>
          </li>
        ))}
        {overrides.length === 0 && <li className="text-sm text-ink-soft">No overrides — using calculated times every week.</li>}
      </ul>
    </Card>
  );
}
