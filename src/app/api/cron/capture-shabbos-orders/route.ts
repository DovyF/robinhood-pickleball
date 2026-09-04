import { NextRequest, NextResponse } from "next/server";
import { captureShabbosHolds } from "@/lib/orders";

// Runs on a schedule (see vercel.json) to capture card authorizations that were
// deliberately held for Shabbos, now that Shabbos has ended.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await captureShabbosHolds();
  return NextResponse.json(result);
}
