"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { saveSettingsAction } from "@/app/actions/admin/misc";
import { Card } from "@/components/admin/ui";

const FIELDS: { key: string; label: string; type?: string; hint?: string }[] = [
  { key: "store_name", label: "Store name" },
  { key: "store_email", label: "Support email", type: "email" },
  { key: "announcement", label: "Announcement bar text" },
  { key: "free_shipping_threshold", label: "Free shipping threshold ($)", type: "number" },
  { key: "currency", label: "Currency", hint: "ISO code, e.g. USD" },
  { key: "brand_primary", label: "Brand primary color", type: "color" },
  { key: "brand_accent", label: "Brand accent color", type: "color" },
];

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveSettingsAction(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card title="General">
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={f.type === "color" ? "h-10 w-20 rounded border border-cream-dark" : "input"}
              />
              {f.hint && <p className="mt-1 text-xs text-ink-soft">{f.hint}</p>}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="animate-spin" size={16} /> : "Save settings"}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-forest-600"><Check size={16} /> Saved</span>}
      </div>

      <Card title="Integrations">
        <p className="text-sm text-ink-soft">
          API keys (Stripe, Resend, Cloudinary, shipping carriers, analytics pixels) are configured via environment variables for security.
          See <code className="rounded bg-cream px-1">.env.example</code> for the full list. They take effect on next deploy.
        </p>
      </Card>
    </div>
  );
}
