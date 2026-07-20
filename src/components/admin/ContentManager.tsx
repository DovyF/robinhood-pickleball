"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, ArrowUp, ArrowDown, Plus, Trash2, GripVertical } from "lucide-react";
import { updateSectionAction, saveNavItemAction, deleteNavItemAction } from "@/app/actions/admin/misc";
import { Card } from "@/components/admin/ui";

interface Section { id: string; type: string; title: string | null; enabled: boolean; position: number; }
interface NavItem { id: string; label: string; url: string; position: number; }

const SECTION_LABEL: Record<string, string> = {
  hero: "Hero banner", logo_list: "Trust badges", featured_collection: "Featured collection",
  image_banner: "Image banner", product_grid: "Product grid", testimonials: "Testimonials", newsletter: "Newsletter signup",
};

export function ContentManager({ sections, mainNav, footerNav }: { sections: Section[]; mainNav: NavItem[]; footerNav: NavItem[] }) {
  const [, startTransition] = useTransition();
  const [secs, setSecs] = useState(sections);

  function toggle(s: Section) {
    setSecs((prev) => prev.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)));
    startTransition(() => updateSectionAction(s.id, { enabled: !s.enabled }).then(() => {}));
  }
  function move(s: Section, dir: -1 | 1) {
    startTransition(() => updateSectionAction(s.id, { position: s.position + dir }).then(() => {}));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Homepage sections">
        <p className="mb-3 text-sm text-ink-soft">Toggle visibility and reorder sections.</p>
        <div className="space-y-2">
          {secs.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-lg border border-cream-dark px-3 py-2">
              <GripVertical size={16} className="text-ink-soft" />
              <div className="flex-1">
                <p className="text-sm font-medium">{SECTION_LABEL[s.type] ?? s.type}</p>
                {s.title && <p className="text-xs text-ink-soft">{s.title}</p>}
              </div>
              <button onClick={() => move(s, -1)} className="grid h-7 w-7 place-items-center rounded hover:bg-cream" aria-label="Move up"><ArrowUp size={14} /></button>
              <button onClick={() => move(s, 1)} className="grid h-7 w-7 place-items-center rounded hover:bg-cream" aria-label="Move down"><ArrowDown size={14} /></button>
              <button onClick={() => toggle(s)} className={`grid h-7 w-7 place-items-center rounded ${s.enabled ? "text-forest-600" : "text-ink-soft"}`} aria-label="Toggle">
                {s.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <NavEditor title="Main menu" menu="main" items={mainNav} />
        <NavEditor title="Footer menu" menu="footer" items={footerNav} />
      </div>
    </div>
  );
}

function NavEditor({ title, menu, items }: { title: string; menu: string; items: NavItem[] }) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => saveNavItemAction({ menu, label: String(fd.get("label")), url: String(fd.get("url")), position: items.length }).then(() => setAdding(false)));
  }

  return (
    <Card title={title} action={<button onClick={() => setAdding((v) => !v)} className="text-sm font-semibold text-forest-700"><Plus size={14} className="inline" /> Add</button>}>
      <div className="space-y-1.5">
        {items.map((n) => (
          <div key={n.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-cream">
            <span><strong>{n.label}</strong> <span className="text-ink-soft">→ {n.url}</span></span>
            <button onClick={() => startTransition(() => deleteNavItemAction(n.id).then(() => {}))} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink-soft">No items.</p>}
      </div>
      {adding && (
        <form onSubmit={add} className="mt-3 flex gap-2">
          <input name="label" required placeholder="Label" className="input flex-1" />
          <input name="url" required placeholder="/collections/x" className="input flex-1" />
          <button type="submit" className="btn btn-primary text-sm">Add</button>
        </form>
      )}
    </Card>
  );
}
