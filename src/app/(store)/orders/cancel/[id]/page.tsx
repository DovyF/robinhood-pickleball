import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { CancelOrderButton } from "@/components/checkout/CancelOrderButton";
import { PaymentStatus } from "@/lib/enums";

export const metadata: Metadata = { title: "Cancel order", robots: { index: false } };

export default async function CancelOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
  const { id } = await params;
  const { token } = await searchParams;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || !token || order.cancelToken !== token) notFound();

  const alreadyResolved = order.paymentStatus !== PaymentStatus.AUTHORIZED;

  return (
    <div className="container-x max-w-lg py-16">
      <h1 className="text-2xl font-extrabold">Order #{order.orderNumber}</h1>
      <p className="mt-2 text-ink-soft">
        {alreadyResolved
          ? "This order has already been processed or cancelled — there's nothing more to do here."
          : `Your card has a ${formatMoney(order.total)} hold, not a charge. Cancelling here releases the hold completely — you will never be charged.`}
      </p>
      <div className="mt-6">
        {!alreadyResolved && <CancelOrderButton orderId={order.id} token={token} />}
      </div>
    </div>
  );
}
