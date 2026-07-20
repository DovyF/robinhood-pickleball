"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/actions/admin/products";

export function ProductRowActions({ id, slug }: { id: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((v) => !v)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-cream-dark" aria-label="Actions">
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl bg-white p-1 text-left shadow-lift">
            <Link href={`/admin/products/${id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-cream"><Pencil size={14} /> Edit</Link>
            <Link href={`/products/${slug}`} target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-cream"><ExternalLink size={14} /> View</Link>
            <button
              onClick={() => { if (confirm("Delete this product? This cannot be undone.")) startTransition(() => deleteProductAction(id).then(() => setOpen(false))); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
