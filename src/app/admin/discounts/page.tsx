import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { DiscountManager } from "@/components/admin/DiscountManager";

export default async function AdminDiscounts() {
  const discounts = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Discounts" subtitle={`${discounts.length} codes`} />
      <DiscountManager
        discounts={discounts.map((d) => ({
          id: d.id, code: d.code, type: d.type, value: d.value, status: d.status,
          minSubtotal: d.minSubtotal, usageCount: d.usageCount, usageLimit: d.usageLimit,
          endsAt: d.endsAt ? d.endsAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
