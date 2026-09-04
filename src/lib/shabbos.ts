// Shabbos-aware checkout: no payment may be captured (moved into the store's
// account) between candle-lighting and havdalah. We still let customers place
// orders and authorize their card, we just delay the actual capture.
import { prisma } from "@/lib/prisma";

const DEFAULT_ZIP = "10952";
const DEFAULT_HAVDALAH_MINUTES = 50;

export interface ShabbosWindow {
  start: Date; // candle lighting
  end: Date; // havdalah
}

/** Friday (date-only, UTC midnight) of the week containing `date`. Shabbos "belongs"
 * to its Friday for override lookups, regardless of which day of the week `date` falls on. */
function fridayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  // Days since the most recent Friday, treating Sat/Sun as "still counts toward last week's Shabbos".
  const diff = day >= 5 ? day - 5 : day + 2;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value || null;
}

async function fetchHebcalWindow(zip: string, havdalahMinutes: number, friday: Date): Promise<ShabbosWindow | null> {
  const start = friday.toISOString().slice(0, 10);
  const end = new Date(friday.getTime() + 2 * 86400_000).toISOString().slice(0, 10); // Sunday, inclusive end
  const url = `https://www.hebcal.com/shabbat?cfg=json&zip=${encodeURIComponent(zip)}&m=${havdalahMinutes}&start=${start}&end=${end}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const items: { category: string; date: string }[] = data.items ?? [];
    const candles = items.find((i) => i.category === "candles");
    const havdalah = items.find((i) => i.category === "havdalah");
    if (!candles || !havdalah) return null;
    return { start: new Date(candles.date), end: new Date(havdalah.date) };
  } catch {
    return null;
  }
}

/** The Shabbos window (candle lighting -> havdalah) for the week containing `reference`. */
export async function getShabbosWindow(reference: Date = new Date()): Promise<ShabbosWindow> {
  const friday = fridayOf(reference);

  const override = await prisma.shabbosOverride.findUnique({ where: { weekOf: friday } });
  const zip = override?.zip || (await getSetting("shabbos_zip")) || DEFAULT_ZIP;
  const havdalahMinutes = Number((await getSetting("shabbos_havdalah_minutes")) || DEFAULT_HAVDALAH_MINUTES);

  const calculated = await fetchHebcalWindow(zip, havdalahMinutes, friday);

  // Fail SAFE: if the zmanim API is unreachable and there's no override, don't
  // assume "not Shabbos" (that could let a real Shabbos payment get captured).
  // Use a deliberately generous fallback window instead — worse case we hold a
  // payment a bit longer than strictly necessary, never the other way around.
  const fallbackStart = new Date(friday.getTime() + 20 * 3600_000); // ~4pm Eastern Friday
  const fallbackEnd = new Date(fallbackStart.getTime() + 30 * 3600_000); // generously past Saturday night

  return {
    start: override?.startsAt ?? calculated?.start ?? fallbackStart,
    end: override?.endsAt ?? calculated?.end ?? fallbackEnd,
  };
}

export async function isShabbosNow(reference: Date = new Date()): Promise<boolean> {
  const enabled = (await getSetting("shabbos_enabled")) ?? "true";
  if (enabled === "false") return false;
  const window = await getShabbosWindow(reference);
  return reference >= window.start && reference < window.end;
}

export function normalizeWeekOf(date: Date): Date {
  return fridayOf(date);
}
