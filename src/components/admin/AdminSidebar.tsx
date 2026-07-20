"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, FolderTree, Users, Tag, BarChart3, FileText, Settings, ScrollText, Gift, Truck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES } from "@/lib/enums";

const groups: { title: string; items: { href: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Sell",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/fulfillment", label: "Fulfillment", icon: Truck },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/collections", label: "Collections", icon: FolderTree },
      { href: "/admin/discounts", label: "Discounts", icon: Tag },
      { href: "/admin/gift-cards", label: "Gift cards", icon: Gift },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content", label: "Homepage & Nav", icon: LayoutDashboard },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
      { href: "/admin/logs", label: "Logs", icon: ScrollText, adminOnly: true },
    ],
  },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = ADMIN_ROLES.includes(role);

  return (
    <aside className="hidden border-r border-cream-dark bg-panel lg:flex lg:flex-col">
      <div className="border-b border-cream-dark p-5">
        <Logo />
        <p className="mt-1 text-xs font-medium text-ink-soft">Admin</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft/60">{g.title}</p>
            {g.items
              .filter((i) => !i.adminOnly || isAdmin)
              .map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-forest-700 text-black" : "text-ink hover:bg-cream-dark")}>
                    <Icon size={17} /> {item.label}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
      <div className="border-t border-cream-dark p-3">
        <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-cream-dark">
          ← View store
        </Link>
      </div>
    </aside>
  );
}
