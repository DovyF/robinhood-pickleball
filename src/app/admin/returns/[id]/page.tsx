import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ReturnActions } from "@/components/admin/ReturnActions";
import { RETURN_REASON_LABELS } from "@/lib/enums";
import { LocalTime } from "@/components/admin/LocalTime";
import { formatMoney, safeJson } from "@/lib/utils";

export default async function AdminReturnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ret = await prisma.returnRequest.findUnique({
    where: { id },
    include: { order: { include: { items: true } } },
  });
  if (!ret) notFound();

  const itemRefs = safeJson<{ orderItemId: string; quantity: number }[]>(ret.itemsJson, []);
  const returnedItems = ret.order.items.filter((i) => itemRefs.some((r) => r.orderItemId === i.id));
  const photoUrls = safeJson<string[]>(ret.photoUrls, []);

  return (
    <div>
      <Link href="/admin/returns" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700 transition"><ArrowLeft size={15} /> Back to Returns</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold">Return for order #{ret.order.orderNumber}</h1>
            <StatusBadge status={ret.status} />
          </div>
          <p className="text-sm text-ink-soft">Requested <LocalTime date={ret.createdAt.toISOString()} options={{ dateStyle: "long", timeStyle: "short" }} /></p>
        </div>
        <Link href={`/admin/orders/${ret.orderId}`} className="text-sm font-semibold text-forest-700 hover:text-gold-300">View full order →</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <ReturnActions ret={{ id: ret.id, status: ret.status, orderTotal: ret.order.total, refundedTotal: ret.order.refundedTotal }} />
          </Card>

          <Card title="Items being returned">
            <ul className="divide-y divide-cream-dark">
              {returnedItems.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-cream-dark shrink-0">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />}</div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-ink">{i.title}</p>
                    {i.variantTitle && <p className="text-ink-soft text-xs">{i.variantTitle}</p>}
                  </div>
                  <p className="text-sm font-semibold text-gold-300">{formatMoney(i.price)}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Reason & notes">
            <p className="text-sm"><span className="text-ink-soft">Reason:</span> <strong>{RETURN_REASON_LABELS[ret.reason] ?? ret.reason}</strong></p>
            {ret.note && <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{ret.note}</p>}
          </Card>

          {photoUrls.length > 0 && (
            <Card title="Customer photos">
              <div className="flex flex-wrap gap-3">
                {photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="relative block h-32 w-32 overflow-hidden rounded-lg bg-cream-dark">
                    <Image src={url} alt="" fill sizes="128px" className="object-cover" />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {ret.adminNote && (
            <Card title="Decision note">
              <p className="text-sm text-ink-soft">{ret.adminNote}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="text-sm text-ink-soft">{ret.email}</p>
            <p className="mt-3 text-sm border-t border-cream-dark pt-3">
              <span className="text-ink-soft">Order total:</span> <strong className="text-ink ml-1">{formatMoney(ret.order.total)}</strong>
            </p>
            {ret.order.refundedTotal > 0 && (
              <p className="mt-1 text-sm text-red-500">Already refunded: {formatMoney(ret.order.refundedTotal)}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
