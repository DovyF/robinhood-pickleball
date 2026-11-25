// Creates (or re-enables) the LONGBOW discount: 25% off the subtotal.
// Applies before tax and shipping (see computeDiscount in src/lib/pricing.ts).
// Safe to re-run: it upserts, so it never creates a duplicate.
// Usage: npx tsx scripts/create-longbow-code.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.discountCode.upsert({
    where: { code: "LONGBOW" },
    update: { type: "percentage", value: 25, appliesTo: "all", status: "active", endsAt: null },
    create: { code: "LONGBOW", type: "percentage", value: 25, appliesTo: "all", status: "active" },
  });
  console.log(`LONGBOW ready: ${row.value}% off, status=${row.status}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
