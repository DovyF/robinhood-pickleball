// npx tsx scripts/test-shabbos-periods.ts — the Shabbos/Yom Tov payment hold periods (src/lib/shabbos-periods.ts).
// Chanukah starting on a Friday (Dec 2026) must give two ordinary Shabbos holds, not one 8-day hold; Sukkot and Pesach still hold through Chol Hamoed.
import assert from "node:assert";
import { buildHolyPeriods, type HebcalItem } from "../src/lib/shabbos-periods";

const hrs = (p: { start: Date; end: Date }) => Math.round((p.end.getTime() - p.start.getTime()) / 36e5);
async function hebcal(start: string, end: string): Promise<HebcalItem[]> {
  const r = await fetch(`https://www.hebcal.com/hebcal?cfg=json&v=1&maj=on&c=on&geo=zip&zip=10952&m=50&start=${start}&end=${end}`);
  return (await r.json()).items ?? [];
}
(async () => {
  const chanukah = buildHolyPeriods(await hebcal("2026-11-30", "2026-12-14"));
  assert.ok(chanukah.length >= 2 && chanukah.every((p) => hrs(p) <= 26), "Chanukah 2026: separate Shabbos holds, none longer than a day");
  const sukkot = buildHolyPeriods(await hebcal("2026-09-22", "2026-10-06"));
  assert.ok(sukkot.some((p) => hrs(p) > 200), "Sukkot 2026 holds through Chol Hamoed");
  const pesach = buildHolyPeriods(await hebcal("2027-04-18", "2027-05-02"));
  assert.ok(pesach.some((p) => hrs(p) > 180), "Pesach 2027 holds through Chol Hamoed");
  for (const p of [...chanukah, ...sukkot, ...pesach]) console.log(p.start.toISOString().slice(0, 16), "->", p.end.toISOString().slice(0, 16), hrs(p) + "h");
  console.log("ok - Chanukah gives normal Shabbos holds; Sukkot and Pesach hold straight through");
})().catch((e) => { console.error(e); process.exit(1); });
