import Link from "next/link";

type Key = "a" | "b" | "c" | "d" | "e" | "f";

/** Floating switcher so all six previews can be compared without hitting Home. */
export function PreviewSwitcher({ current }: { current: Key }) {
  const items: { key: Key; label: string }[] = [
    { key: "a", label: "A · Editorial" },
    { key: "b", label: "B · Spotlight" },
    { key: "c", label: "C · Poster" },
    { key: "d", label: "D · Cinematic" },
    { key: "e", label: "E · Elevated" },
    { key: "f", label: "F · Richer" },
  ];
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#2e2e2e] bg-[#141414]/90 p-1.5 shadow-lift backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-1">
        {items.map((it) => (
          <Link
            key={it.key}
            href={`/preview/${it.key}`}
            className={`rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
              current === it.key ? "bg-forest-700 text-[#0d0d0d]" : "text-ink-soft hover:text-white"
            }`}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
