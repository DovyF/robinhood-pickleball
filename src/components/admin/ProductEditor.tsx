"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { saveProductAction, uploadImageAction } from "@/app/actions/admin/products";
import { Card } from "@/components/admin/ui";

interface EditorVariant {
  id?: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  option1: string | null;
  inventoryQty: number;
  trackInventory: boolean;
  weightGrams: number;
}

export interface EditorProduct {
  id?: string;
  title: string;
  slug?: string;
  description: string;
  productType: string;
  vendor: string;
  status: "draft" | "active" | "archived";
  featured: boolean;
  price: number;
  compareAtPrice: number | null;
  costPerItem: number | null;
  weightGrams: number;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  optionName: string;
  images: string[];
  variants: EditorVariant[];
}

const blank: EditorProduct = {
  title: "", description: "", productType: "", vendor: "", status: "draft", featured: false,
  price: 0, compareAtPrice: null, costPerItem: null, weightGrams: 0, tags: "",
  seoTitle: "", seoDescription: "", optionName: "", images: [], variants: [],
};

export function ProductEditor({ initial }: { initial?: EditorProduct }) {
  const router = useRouter();
  const [p, setP] = useState<EditorProduct>(initial ?? blank);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const useVariants = p.variants.length > 0;

  function set<K extends keyof EditorProduct>(k: K, v: EditorProduct[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok) setP((prev) => ({ ...prev, images: [...prev.images, res.url] }));
    }
    setUploading(false);
  }

  function addVariant() {
    setP((prev) => ({
      ...prev,
      optionName: prev.optionName || "Option",
      variants: [...prev.variants, { title: "", sku: "", price: prev.price, compareAtPrice: prev.compareAtPrice, option1: "", inventoryQty: 0, trackInventory: true, weightGrams: prev.weightGrams }],
    }));
  }
  function updateVariant(i: number, patch: Partial<EditorVariant>) {
    setP((prev) => ({ ...prev, variants: prev.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));
  }
  function removeVariant(i: number) {
    setP((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  }

  function save(nextStatus?: "draft" | "active") {
    setError("");
    const payload = { ...p, status: nextStatus ?? p.status };
    startTransition(async () => {
      const res = await saveProductAction(payload);
      if (!res.ok) return setError(res.error);
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <label className="label">Title</label>
          <input value={p.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Robinhood Pro Carbon Paddle" className="input" />
          <label className="label mt-4">Description</label>
          <textarea value={p.description} onChange={(e) => set("description", e.target.value)} rows={6} placeholder="Describe the product…" className="input" />
        </Card>

        <Card title="Media">
          <div className="flex flex-wrap gap-3">
            {p.images.map((url, i) => (
              <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg bg-cream">
                <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                <button onClick={() => set("images", p.images.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white opacity-0 transition group-hover:opacity-100">
                  <X size={13} />
                </button>
              </div>
            ))}
            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-cream-dark text-ink-soft hover:border-forest-400">
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
            </label>
          </div>
        </Card>

        <Card title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label">Price</label><input type="number" step="0.01" value={p.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} className="input" /></div>
            <div><label className="label">Compare at</label><input type="number" step="0.01" value={p.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? parseFloat(e.target.value) : null)} className="input" /></div>
            <div><label className="label">Cost / item</label><input type="number" step="0.01" value={p.costPerItem ?? ""} onChange={(e) => set("costPerItem", e.target.value ? parseFloat(e.target.value) : null)} className="input" /></div>
          </div>
          {p.costPerItem && p.price > 0 && (
            <p className="mt-2 text-xs text-ink-soft">Margin: {(((p.price - p.costPerItem) / p.price) * 100).toFixed(0)}% · Profit: ${(p.price - p.costPerItem).toFixed(2)}</p>
          )}
        </Card>

        <Card title="Variants" action={<button onClick={addVariant} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700"><Plus size={15} /> Add variant</button>}>
          {!useVariants ? (
            <div>
              <p className="text-sm text-ink-soft">No variants. This product is sold as a single option.</p>
              <div className="mt-3"><label className="label">Inventory tracking</label>
                <p className="text-xs text-ink-soft">Manage stock in the Inventory tab after saving, or add variants for sizes/colors.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div><label className="label">Option name</label><input value={p.optionName} onChange={(e) => set("optionName", e.target.value)} placeholder="e.g. Size, Color, Weight" className="input max-w-xs" /></div>
              {p.variants.map((v, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-cream-dark p-3">
                  <GripVertical size={16} className="mb-3 text-ink-soft" />
                  <div className="flex-1 min-w-32"><label className="label">Value</label><input value={v.option1 ?? ""} onChange={(e) => updateVariant(i, { option1: e.target.value, title: e.target.value })} placeholder="e.g. Large" className="input" /></div>
                  <div className="w-24"><label className="label">Price</label><input type="number" step="0.01" value={v.price} onChange={(e) => updateVariant(i, { price: parseFloat(e.target.value) || 0 })} className="input" /></div>
                  <div className="w-20"><label className="label">Stock</label><input type="number" value={v.inventoryQty} onChange={(e) => updateVariant(i, { inventoryQty: parseInt(e.target.value) || 0 })} className="input" /></div>
                  <div className="w-28"><label className="label">SKU</label><input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} className="input" /></div>
                  <button onClick={() => removeVariant(i)} className="mb-2 grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Search engine listing (SEO)">
          <label className="label">Page title</label>
          <input value={p.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={p.title} className="input" />
          <label className="label mt-3">Meta description</label>
          <textarea value={p.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} className="input" />
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card title="Status">
          <select value={p.status} onChange={(e) => set("status", e.target.value as EditorProduct["status"])} className="input">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-forest-700" /> Featured on homepage
          </label>
        </Card>

        <Card title="Organization">
          <label className="label">Product type</label>
          <input value={p.productType} onChange={(e) => set("productType", e.target.value)} placeholder="e.g. Paddles" className="input" />
          <label className="label mt-3">Vendor</label>
          <input value={p.vendor} onChange={(e) => set("vendor", e.target.value)} className="input" />
          <label className="label mt-3">Tags</label>
          <input value={p.tags} onChange={(e) => set("tags", e.target.value)} placeholder="comma, separated, tags" className="input" />
          <label className="label mt-3">Weight (grams)</label>
          <input type="number" value={p.weightGrams} onChange={(e) => set("weightGrams", parseFloat(e.target.value) || 0)} className="input" />
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-2">
          <button onClick={() => save("active")} disabled={pending || !p.title} className="btn btn-primary w-full disabled:opacity-50">
            {pending ? <Loader2 className="animate-spin" size={18} /> : p.id ? "Save changes" : "Publish product"}
          </button>
          <button onClick={() => save("draft")} disabled={pending || !p.title} className="btn btn-outline w-full disabled:opacity-50">Save as draft</button>
        </div>
      </div>
    </div>
  );
}
