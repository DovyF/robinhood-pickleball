// Shabbos & Yom Tov aware checkout: no payment may be captured (moved into
// the store's account) between candle-lighting and havdalah — for the
// regular weekly Shabbos AND for Yom Tov (including multi-day Yom Tov and a
// Yom Tov that runs straight into an adjacent Shabbos). We still let
// customers place orders and authorize their card, we just delay capture.
import { prisma } from "@/lib/prisma";

const DEFAULT_ZIP = "10952";
const DEFAULT_HAVDALAH_MINUTES = 50;

export interface ShabbosWindow {
  start: Date; // candle lighting
  end: Date; // havdalah
}

interface HolyPeriod extends ShabbosWindow {
  label: string;
}

/** Friday (date-only, UTC midnight) of the week containing `date` — used only to key the
 * weekly Shabbos override lookup, regardless of which day of the week `date` falls on. */
function fridayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const diff = day >= 5 ? day - 5 : day + 2;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value || null;
}

/**
 * Every candle-lighting -> havdalah span in the given range, from Hebcal's
 * general calendar endpoint (not the Shabbat-only one) so it picks up Yom Tov
 * too. Hebcal already emits one continuous span across a multi-day Yom Tov,
 * and across a Yom Tov that runs straight into Shabbos — we just pair up
 * consecutive candles/havdalah entries in order.
 */
async function fetchHolyPeriods(zip: string, havdalahMinutes: number, rangeStart: Date, rangeEnd: Date): Promise<HolyPeriod[]> {
  const start = rangeStart.toISOString().slice(0, 10);
  const end = rangeEnd.toISOString().slice(0, 10);
  const url = `https://www.hebcal.com/hebcal?cfg=json&v=1&maj=on&c=on&geo=zip&zip=${encodeURIComponent(zip)}&m=${havdalahMinutes}&start=${start}&end=${end}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items: { category: string; date: string; title: string }[] = data.items ?? [];

    const periods: HolyPeriod[] = [];
    let pendingStart: Date | null = null;
    let label = "";
    for (const item of items) {
      if (item.category === "candles" && pendingStart === null) {
        pendingStart = new Date(item.date);
        label = item.title;
      } else if (item.category === "havdalah" && pendingStart !== null) {
        periods.push({ start: pendingStart, end: new Date(item.date), label });
        pendingStart = null;
      }
    }
    return periods;
  } catch {
    return [];
  }
}

/** The Shabbos/Yom Tov window (candle lighting -> havdalah) covering — or nearest upcoming to — `reference`. */
export async function getShabbosWindow(reference: Date = new Date()): Promise<ShabbosWindow> {
  const friday = fridayOf(reference);

  const override = await prisma.shabbosOverride.findUnique({ where: { weekOf: friday } });
  const zip = override?.zip || (await getSetting("shabbos_zip")) || DEFAULT_ZIP;
  const havdalahMinutes = Number((await getSetting("shabbos_havdalah_minutes")) || DEFAULT_HAVDALAH_MINUTES);

  const rangeStart = new Date(reference.getTime() - 4 * 86400_000);
  const rangeEnd = new Date(reference.getTime() + 10 * 86400_000);
  const periods = await fetchHolyPeriods(zip, havdalahMinutes, rangeStart, rangeEnd);
  const period = periods.find((p) => reference >= p.start && reference < p.end) ?? periods.find((p) => p.start > reference) ?? null;

  // Fail SAFE: if the zmanim API is unreachable and there's no override, don't
  // assume "not a holy period" (that could let a real Shabbos/Yom Tov payment
  // get captured). Generous fallback window — worst case we hold a payment a
  // bit longer than necessary, never the other way around.
  const fallbackStart = new Date(friday.getTime() + 20 * 3600_000); // ~4pm Eastern Friday
  const fallbackEnd = new Date(fallbackStart.getTime() + 30 * 3600_000); // generously past Saturday night

  // The weekly override's custom start/end only apply when the relevant period IS
  // this week's regular Shabbos (same Friday) — it shouldn't reach into an
  // unrelated Yom Tov elsewhere in the fetched range.
  const isThisWeeksShabbos = period && Math.abs(period.start.getTime() - friday.getTime()) < 3 * 86400_000;

  return {
    start: (isThisWeeksShabbos ? override?.startsAt : null) ?? period?.start ?? fallbackStart,
    end: (isThisWeeksShabbos ? override?.endsAt : null) ?? period?.end ?? fallbackEnd,
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
