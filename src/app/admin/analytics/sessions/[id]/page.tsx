import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Package, ShoppingCart, CreditCard, CheckCircle2, Search as SearchIcon, Circle, Bot } from "lucide-react";
import { getSessionDetail, getSessionProfile } from "@/lib/analytics";
import { PageHeader, Card } from "@/components/admin/ui";
import { LocalTime } from "@/components/admin/LocalTime";

const ICONS: Record<string, typeof Eye> = {
  page_view: Eye,
  product_view: Package,
  add_to_cart: ShoppingCart,
  begin_checkout: CreditCard,
  purchase: CheckCircle2,
  search: SearchIcon,
};

function fmtDuration(sec: number) {
  return sec < 60 ? `${Math.round(sec)}s` : `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-t border-cream-dark py-2 text-sm first:border-t-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`break-all text-ink ${mono ? "font-mono text-xs" : ""}`}>{value || <span className="text-ink-soft/60">—</span>}</dd>
    </div>
  );
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [events, profile] = await Promise.all([getSessionDetail(id), getSessionProfile(id)]);
  if (events.length === 0 || !profile) notFound();

  const first = events[0];
  const last = events[events.length - 1];
  const durationSec = (last.createdAt.getTime() - first.createdAt.getTime()) / 1000;
  const utmText = [profile.utm.source, profile.utm.medium, profile.utm.campaign, profile.utm.term, profile.utm.content].filter(Boolean).join(" / ");
  const capturedExtras = !!profile.landingUrl;

  return (
    <div>
      <Link href="/admin/analytics/sessions" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700 transition"><ArrowLeft size={15} /> Back to Sessions</Link>
      <PageHeader
        title="Session detail"
        subtitle={<><LocalTime date={first.createdAt.toISOString()} options={{ dateStyle: "long", timeStyle: "short" }} /> · {events.length} events · {profile.pagesViewed} pages · {fmtDuration(durationSec)} total</>}
      />

      {profile.isBot && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
          <Bot size={16} /> This looks like an automated bot/crawler{profile.botName ? ` (${profile.botName})` : ""}, not a real visitor.
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Where they came from">
          <dl>
            <Row label="Source" value={profile.source} />
            <Row label="Exact referring link" value={profile.referrer ? <a href={profile.referrer} target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:text-gold-300">{profile.referrer}</a> : "None (typed the URL, bookmark, or app that hides it)"} mono />
            <Row
              label="Search terms"
              value={profile.searchQuery ? `"${profile.searchQuery}"` : profile.searchQueryNote ? <span className="text-ink-soft">{profile.searchQueryNote}</span> : undefined}
            />
            <Row label="Landed on" value={profile.landingUrl ?? profile.landingPath} mono />
            <Row label="Campaign tags" value={utmText} />
            {profile.clickIds.map((c) => <Row key={c.label} label={c.label} value={c.value} mono />)}
            <Row label="Left from" value={profile.exitPage} mono />
            {profile.email && <Row label="Email" value={profile.email} />}
          </dl>
        </Card>

        <Card title="Who / what device">
          <dl>
            <Row label="Location" value={profile.location ? `${profile.location} (approx., from IP)` : undefined} />
            <Row label="Device" value={[profile.device, profile.os, profile.browser].filter(Boolean).join(" · ")} />
            <Row label="Screen" value={profile.screen ? `${profile.screen}${profile.viewport ? ` (window ${profile.viewport})` : ""}` : undefined} />
            <Row label="Language" value={profile.language} />
            <Row label="Timezone" value={profile.timezone} />
            <Row label="User agent" value={profile.userAgent} mono />
          </dl>
          {!capturedExtras && (
            <p className="mt-3 text-xs text-ink-soft">
              Location, screen, language, timezone, and full landing URL are only recorded for sessions from Sept 21, 2026 onward.
            </p>
          )}
        </Card>
      </div>

      <Card title="Timeline">
        <ol className="relative space-y-6 border-l border-cream-dark pl-6">
          {events.map((e, i) => {
            const Icon = ICONS[e.type] ?? Circle;
            const next = events[i + 1];
            const spent = next ? (next.createdAt.getTime() - e.createdAt.getTime()) / 1000 : null;
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-forest-700 text-black">
                  <Icon size={13} />
                </span>
                <p className="text-sm font-medium text-ink">{e.label}</p>
                <p className="text-xs text-ink-soft">
                  <LocalTime date={e.createdAt.toISOString()} options={{ dateStyle: "medium", timeStyle: "medium" }} />
                  {spent !== null && spent >= 1 ? ` · ${fmtDuration(spent)} until next action` : next ? "" : " · last action (left after this)"}
                </p>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
