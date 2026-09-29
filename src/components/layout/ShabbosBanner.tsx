import { isShabbosNow, getShabbosWindow } from "@/lib/shabbos";
import { LocalTime } from "@/components/admin/LocalTime";

export async function ShabbosBanner() {
  const active = await isShabbosNow();
  if (!active) return null;

  const window = await getShabbosWindow();

  return (
    <div className="bg-amber-900 px-4 py-2 text-center text-xs font-medium text-amber-100">
      🕯️ It&apos;s currently Shabbos/Yom Tov. You can still place an order — your card will be authorized, not charged, and everything processes once it ends (
      <LocalTime date={window.end.toISOString()} options={{ weekday: "long", hour: "numeric", minute: "2-digit", timeZoneName: "short" }} />
      ).
    </div>
  );
}
