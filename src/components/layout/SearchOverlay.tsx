"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface Result {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string | null;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ("");
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 top-0 bg-cream p-4 shadow-lift">
        <div className="container-x">
          <form onSubmit={submit} className="flex items-center gap-3">
            <Search size={22} className="text-ink-soft" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search paddles, balls, apparel…"
              className="flex-1 bg-transparent py-3 text-lg outline-none placeholder:text-ink-soft/60"
            />
            {loading && <Loader2 className="animate-spin text-ink-soft" size={20} />}
            <button type="button" onClick={onClose} aria-label="Close search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark">
              <X size={22} />
            </button>
          </form>

          {results.length > 0 && (
            <ul className="mt-2 max-h-[60vh] divide-y divide-cream-dark overflow-y-auto">
              {results.map((r) => (
                <li key={r.id}>
                  <Link href={`/products/${r.slug}`} onClick={onClose} className="flex items-center gap-3 py-3 hover:bg-cream-dark/50 rounded-lg px-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-panel">
                      {r.image && <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <span className="flex-1 font-medium">{r.title}</span>
                    <span className="text-sm font-semibold">{formatMoney(r.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {q.trim() && !loading && results.length === 0 && (
            <p className="py-6 text-center text-ink-soft">No products found for &ldquo;{q}&rdquo;.</p>
          )}
        </div>
      </div>
    </div>
  );
}
