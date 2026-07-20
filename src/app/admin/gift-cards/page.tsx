import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { GiftCardManager } from "@/components/admin/GiftCardManager";

export default async function GiftCardsPage() {
  const cards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Gift cards" subtitle={`${cards.length} cards`} />
      <GiftCardManager cards={cards.map((c) => ({ id: c.id, code: c.code, initialValue: c.initialValue, balance: c.balance, status: c.status, recipientEmail: c.recipientEmail }))} />
    </div>
  );
}
