export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  const items = Array(4).fill(text);
  return (
    <div className="bg-forest-800 text-white overflow-hidden">
      <div className="flex whitespace-nowrap py-2 text-xs font-medium tracking-wide">
        <div className="flex animate-marquee">
          {items.map((t, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-2">
              <span className="text-gold-400">✦</span> {t}
            </span>
          ))}
        </div>
        <div className="flex animate-marquee" aria-hidden>
          {items.map((t, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-2">
              <span className="text-gold-400">✦</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
