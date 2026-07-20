"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

const SORTS = [
  { value: "best-selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "title-asc", label: "Alphabetical" },
];

export function CollectionToolbar({ count, types }: { count: number; types?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-cream-dark pb-4">
      <p className="text-sm text-ink-soft">{count} products</p>
      <div className="flex items-center gap-2">
        {types && types.length > 0 && (
          <div className="relative">
            <select
              value={params.get("type") ?? ""}
              onChange={(e) => setParam("type", e.target.value)}
              className="appearance-none rounded-full border border-cream-dark bg-panel py-2 pl-4 pr-9 text-sm font-medium outline-none"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          </div>
        )}
        <div className="relative">
          <select
            value={params.get("sort") ?? "best-selling"}
            onChange={(e) => setParam("sort", e.target.value)}
            className="appearance-none rounded-full border border-cream-dark bg-panel py-2 pl-4 pr-9 text-sm font-medium outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        </div>
      </div>
    </div>
  );
}
