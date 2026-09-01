import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Package, ShoppingCart, CreditCard, CheckCircle2, Search as SearchIcon, Circle } from "lucide-react";
import { getSessionDetail } from "@/lib/analytics";
import { PageHeader, Card } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

const ICONS: Record<string, typeof Eye> = {
  page_view: Eye,
  product_view: Package,
  add_to_cart: ShoppingCart,
  begin_checkout: CreditCard,
  purchase: CheckCircle2,
  search: SearchIcon,
};

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getSessionDetail(id);
  if (events.length === 0) notFound();

  const first = events[0];
  const last = events[events.length - 1];
  const durationSec = (last.createdAt.getTime() - first.createdAt.getTime()) / 1000;

  return (
    <div>
      <Link href="/admin/analytics/sessions" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700 transition"><ArrowLeft size={15} /> Back to Sessions</Link>
      <PageHeader
        title="Session detail"
        subtitle={`${formatDate(first.createdAt, { dateStyle: "long", timeStyle: "short" })} · ${events.length} events · ${durationSec < 60 ? `${Math.round(durationSec)}s` : `${Math.floor(durationSec / 60)}m ${Math.round(durationSec % 60)}s`} total`}
      />

      <Card title="Timeline">
        <ol className="relative space-y-6 border-l border-cream-dark pl-6">
          {events.map((e, i) => {
            const Icon = ICONS[e.type] ?? Circle;
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-forest-700 text-black">
                  <Icon size={13} />
                </span>
                <p className="text-sm font-medium text-ink">{e.label}</p>
                <p className="text-xs text-ink-soft">{formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "medium" })}</p>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
