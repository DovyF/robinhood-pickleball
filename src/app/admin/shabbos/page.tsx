import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { getSettings } from "@/lib/repo";
import { getShabbosWindow, isShabbosNow } from "@/lib/shabbos";
import { PaymentStatus } from "@/lib/enums";
import { LocalTime } from "@/components/admin/LocalTime";
import { ShabbosSettingsForm } from "@/components/admin/ShabbosSettingsForm";
import { ShabbosOverridesManager } from "@/components/admin/ShabbosOverridesManager";
import { ShabbosHoldsPanel } from "@/components/admin/ShabbosHoldsPanel";

export default async function ShabbosAdminPage() {
  await requireAdmin();

  const settings = await getSettings();
  const [currentlyShabbos, thisWeek, heldOrders, overrides] = await Promise.all([
    isShabbosNow(),
    getShabbosWindow(),
    prisma.order.findMany({ where: { paymentStatus: PaymentStatus.AUTHORIZED }, orderBy: { captureAfter: "asc" } }),
    prisma.shabbosOverride.findMany({ orderBy: { weekOf: "desc" }, take: 20 }),
  ]);

  return (
    <div>
      <PageHeader title="Shabbos Holds" subtitle="No payment is ever captured between candle-lighting and havdalah — cards are authorized, not charged, and captured automatically once Shabbos ends." />

      <Card title={currentlyShabbos ? "It's currently Shabbos" : "Not currently Shabbos"} className="mb-6">
        <p className="text-sm text-ink-soft">
          This week: <LocalTime date={thisWeek.start.toISOString()} options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }} />
          {" → "}
          <LocalTime date={thisWeek.end.toISOString()} options={{ weekday: "long", hour: "numeric", minute: "2-digit" }} />
        </p>
      </Card>

      <div className="mb-6">
        <ShabbosHoldsPanel
          orders={heldOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            email: o.email,
            total: o.total,
            captureAfter: o.captureAfter?.toISOString() ?? null,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ShabbosSettingsForm
          zip={settings.shabbos_zip || "10952"}
          havdalahMinutes={Number(settings.shabbos_havdalah_minutes || 50)}
          enabled={settings.shabbos_enabled !== "false"}
        />
        <ShabbosOverridesManager
          overrides={overrides.map((o) => ({
            id: o.id,
            weekOf: o.weekOf.toISOString(),
            startsAt: o.startsAt?.toISOString() ?? null,
            endsAt: o.endsAt?.toISOString() ?? null,
            zip: o.zip,
            note: o.note,
          }))}
        />
      </div>
    </div>
  );
}
