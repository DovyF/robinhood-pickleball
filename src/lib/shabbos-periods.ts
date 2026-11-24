// Pure part of the Shabbos/Yom Tov hold (no database, no network), so it can be tested: Hebcal calendar items -> hold periods.
export interface HolyPeriod {
  start: Date;
  end: Date;
  label: string;
}
export interface HebcalItem {
  category: string;
  date: string;
  title: string;
}

const CHOL_HAMOED_FESTIVAL = /pesach|passover|sukkot|sukkos|shmini atzeret|shemini atzeret|simchat torah|simchas torah/i;

export function buildHolyPeriods(items: HebcalItem[]): HolyPeriod[] {
  const basicPeriods: HolyPeriod[] = [];
  let pendingStart: Date | null = null;
  let label = "";
  for (const item of items) {
    if (item.category === "candles" && pendingStart === null) {
      pendingStart = new Date(item.date);
      label = item.title;
    } else if (item.category === "havdalah" && pendingStart !== null) {
      basicPeriods.push({ start: pendingStart, end: new Date(item.date), label });
      pendingStart = null;
    }
  }

  // Contiguous runs of holiday-tagged calendar days (this includes Chol
  // Hamoed weekdays, since Hebcal marks those "holiday" too).
  // Only festivals that HAVE Chol Hamoed (Pesach; Sukkot through Shmini Atzeret / Simchat Torah). Any other run of holiday days must not
  // join two Shabbosos: Chanukah is 8 consecutive holiday days, and when it starts on a Friday (Dec 4 2026) both Fridays' candle lighting
  // fell inside the run, so payments were held from Dec 4 to Dec 12 (longer than a card authorization lasts).
  const holidayDates = [...new Set(items.filter((i) => i.category === "holiday" && CHOL_HAMOED_FESTIVAL.test(i.title || "")).map((i) => i.date.slice(0, 10)))].sort();
  const runs: { start: string; end: string }[] = [];
  for (const d of holidayDates) {
    const prevDay = new Date(Date.parse(`${d}T00:00:00Z`) - 86400_000).toISOString().slice(0, 10);
    const last = runs[runs.length - 1];
    if (last && last.end === prevDay) last.end = d;
    else runs.push({ start: d, end: d });
  }

  // Merge any basic period whose start falls inside a multi-day holiday run
  // into one span covering the whole run (so Chol Hamoed weekdays with no
  // candle-lighting/havdalah of their own still get held).
  const used = new Set<number>();
  const periods: HolyPeriod[] = [];
  for (const run of runs) {
    const runStart = new Date(`${run.start}T00:00:00Z`);
    const runEndExclusive = new Date(Date.parse(`${run.end}T00:00:00Z`) + 86400_000);
    const matches = basicPeriods.map((p, idx) => ({ p, idx })).filter(({ p }) => p.start >= runStart && p.start < runEndExclusive);
    if (matches.length === 0) continue;
    matches.forEach(({ idx }) => used.add(idx));
    const mergedStart = matches.reduce((min, { p }) => (p.start < min ? p.start : min), matches[0].p.start);
    const mergedEnd = matches.reduce((max, { p }) => (p.end > max ? p.end : max), matches[0].p.end);
    periods.push({ start: mergedStart, end: mergedEnd, label: matches[0].p.label });
  }
  basicPeriods.forEach((p, idx) => {
    if (!used.has(idx)) periods.push(p);
  });

  periods.sort((a, b) => a.start.getTime() - b.start.getTime());
  return periods;
}
