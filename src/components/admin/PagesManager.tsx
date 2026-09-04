"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Trash2, FileText } from "lucide-react";
import { savePageAction, deletePageAction } from "@/app/actions/admin/misc";
import { Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";

interface Pg { id?: string; title: string; slug: string; bodyHtml: string; status: string; seoTitle: string | null; seoDescription: string | null; }
const blank: Pg = { title: "", slug: "", bodyHtml: "", status: "published", seoTitle: "", seoDescription: "" };

export function PagesManager({ pages }: { pages: Pg[] }) {
  const [editing, setEditing] = useState<Pg | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function save(p: Pg) {
    setError("");
    startTransition(async () => {
      const res = await savePageAction({
        id: p.id, title: p.title, slug: p.slug || p.title.toLowerCase().replace(/\s+/g, "-"),
        bodyHtml: p.bodyHtml, status: p.status, seoTitle: p.seoTitle ?? undefined, seoDescription: p.seoDescription ?? undefined,
      });
      if (!res.ok) return setError("Error saving page");
      setEditing(null);
    });
  }

  if (editing) {
    return (
      <Card>
        <div className="grid gap-4">
          <div><label className="label">Title</label><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input" /></div>
          <div><label className="label">Handle (URL)</label><input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="about" className="input" /></div>
          <div><label className="label">Content (HTML)</label><textarea value={editing.bodyHtml} onChange={(e) => setEditing({ ...editing, bodyHtml: e.target.value })} rows={12} className="input font-mono text-xs" /></div>
          <div><label className="label">Status</label>
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="input max-w-xs">
              <option value="published">Published</option><option value="draft">Draft</option>
            </select>
          </div>
          <div className="border-t border-cream-dark pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Search engine listing (SEO)</p>
            <label className="label">Page title</label>
            <input value={editing.seoTitle ?? ""} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} placeholder={editing.title} className="input" />
            <label className="label mt-3">Meta description</label>
            <textarea value={editing.seoDescription ?? ""} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} rows={2} className="input" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => save(editing)} disabled={pending} className="btn btn-primary">{pending ? <Loader2 className="animate-spin" size={16} /> : "Save page"}</button>
            <button onClick={() => setEditing(null)} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setEditing(blank)} className="btn btn-primary text-sm"><Plus size={16} /> Add page</button>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-cream-dark bg-panel/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Title</th><th className="px-4 py-3">Handle</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-cream-dark">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-cream-dark/30 transition">
                  <td className="px-4 py-3"><button onClick={() => setEditing(p)} className="inline-flex items-center gap-1.5 font-medium text-forest-700 hover:text-gold-300"><FileText size={14} />{p.title}</button></td>
                  <td className="px-4 py-3 text-ink-soft">/{p.slug}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => { if (confirm("Delete page?")) startTransition(() => deletePageAction(p.id!).then(() => {})); }} className="text-red-500 hover:text-red-400"><Trash2 size={15} /></button></td>
                </tr>
              ))}
              {pages.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-soft">No pages yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
