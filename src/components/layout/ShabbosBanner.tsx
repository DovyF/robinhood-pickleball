import { isShabbosNow, getShabbosWindow } from "@/lib/shabbos";

export async function ShabbosBanner() {
  const active = await isShabbosNow();
  if (!active) return null;

  const window = await getShabbosWindow();
  const endLabel = window.end.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

  return (
    <div className="bg-amber-900 px-4 py-2 text-center text-xs font-medium text-amber-100">
      🕯️ It&apos;s currently Shabbos. You can still place an order — your card will be authorized, not charged, and everything processes once Shabbos ends ({endLabel}).
    </div>
  );
}
