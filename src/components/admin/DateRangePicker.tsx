"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

export function DateRangePicker({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("range", value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex rounded-full border border-cream-dark bg-white p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => set(r.value)}
          className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition", current === r.value ? "bg-forest-700 text-white" : "text-ink-soft hover:text-ink")}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
