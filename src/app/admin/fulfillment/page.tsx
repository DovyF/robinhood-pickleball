import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { FulfillmentQueue } from "@/components/admin/FulfillmentQueue";
import { formatDate, formatMoney } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

export default async function FulfillmentPage() {
  const pendingOrders = await prisma.order.findMany({
    where: {
      fulfillmentStatus: "unfulfilled",
      paymentStatus: "paid",
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const todayOrders = pendingOrders.filter((o) => {
    const today = new Date();
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  return (
    <div>
      <PageHeader
        title="Fulfillment"
        subtitle="Ship orders and generate labels"
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4">
          <p className="text-xs uppercase text-ink-soft font-bold mb-1">Total pending</p>
          <p className="text-3xl font-bold text-gold-300">{pendingOrders.length}</p>
          <p className="text-xs text-ink-soft mt-1">orders to fulfill</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-ink-soft font-bold mb-1">Today</p>
          <p className="text-3xl font-bold text-gold-300">{todayOrders.length}</p>
          <p className="text-xs text-ink-soft mt-1">new orders</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-ink-soft font-bold mb-1">Ready to ship</p>
          <p className="text-3xl font-bold text-forest-400">{pendingOrders.length}</p>
          <p className="text-xs text-ink-soft mt-1">selected items in stock</p>
        </Card>
      </div>

      {pendingOrders.length === 0 ? (
        <EmptyState
          title="All caught up!"
          subtitle="No pending orders to fulfill."
          action={<ShoppingCart size={40} className="text-ink-soft/30 mx-auto" />}
        />
      ) : (
        <FulfillmentQueue orders={pendingOrders} />
      )}
    </div>
  );
}
