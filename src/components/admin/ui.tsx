import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, change, hint }: { label: string; value: string; change?: number; hint?: string }) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-cream-dark bg-panel p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
      {change !== undefined && (
        <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-semibold", up ? "text-gold-300" : "text-red-500")}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(change).toFixed(1)}% vs prev
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-cream-dark bg-panel p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function AdminButton({ href, children, variant = "primary", type = "button", onClick, disabled }: {
  href?: string; children: React.ReactNode; variant?: "primary" | "outline" | "ghost" | "danger"; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean;
}) {
  const cls = cn(
    "btn text-sm",
    variant === "primary" && "btn-primary",
    variant === "outline" && "btn-outline",
    variant === "ghost" && "btn-ghost",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-700"
  );
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cn(cls, "disabled:opacity-50")}>{children}</button>;
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-dark bg-panel p-12 text-center">
      <h3 className="font-bold text-ink">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
