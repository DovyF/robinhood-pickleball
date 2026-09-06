import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// One-time schema migration for the Shabbos payment-hold feature, run through
// the live app's own DB connection since build-time `prisma db push` isn't
// reliably reachable in this environment. All statements are idempotent
// (IF NOT EXISTS) so it's safe to hit more than once. Delete this route once
// it's been run successfully.
export async function GET() {
  await requireAdmin();

  const statements = [
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "captureAfter" TIMESTAMP(3)`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelToken" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_cancelToken_key" ON "Order"("cancelToken")`,
    `CREATE TABLE IF NOT EXISTS "ShabbosOverride" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "weekOf" TIMESTAMP(3) NOT NULL,
      "startsAt" TIMESTAMP(3),
      "endsAt" TIMESTAMP(3),
      "zip" TEXT,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ShabbosOverride_weekOf_key" ON "ShabbosOverride"("weekOf")`,
  ];

  const results: { ok: boolean; statement: string; error?: string }[] = [];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push({ ok: true, statement: sql.slice(0, 60) });
    } catch (e) {
      results.push({ ok: false, statement: sql.slice(0, 60), error: (e as Error).message });
    }
  }

  return NextResponse.json({ results });
}
