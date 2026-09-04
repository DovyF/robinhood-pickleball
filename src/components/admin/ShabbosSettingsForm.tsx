"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { saveShabbosSettingsAction } from "@/app/actions/admin/shabbos";
import { Card } from "@/components/admin/ui";

export function ShabbosSettingsForm({ zip, havdalahMinutes, enabled }: { zip: string; havdalahMinutes: number; enabled: boolean }) {
  const [values, setValues] = useState({ zip, havdalahMinutes, enabled });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveShabbosSettingsAction(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <Card title="Zmanim settings">
      <div className="space-y-4">
        <div>
          <label className="label">ZIP code</label>
          <input value={values.zip} onChange={(e) => setValues((v) => ({ ...v, zip: e.target.value }))} className="input max-w-[160px]" />
          <p className="mt-1 text-xs text-ink-soft">Used to calculate candle-lighting and havdalah times. Add a weekly override below if you're away or making an early Shabbos.</p>
        </div>
        <div>
          <label className="label">Havdalah — minutes after sundown</label>
          <input
            type="number"
            value={values.havdalahMinutes}
            onChange={(e) => setValues((v) => ({ ...v, havdalahMinutes: Number(e.target.value) }))}
            className="input max-w-[160px]"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.enabled} onChange={(e) => setValues((v) => ({ ...v, enabled: e.target.checked }))} />
          Hold payments during Shabbos (turning this off captures payments immediately, even on Shabbos)
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="animate-spin" size={16} /> : "Save"}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-forest-600"><Check size={16} /> Saved</span>}
      </div>
    </Card>
  );
}
