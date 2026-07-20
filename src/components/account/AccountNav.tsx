"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, MapPin, Heart, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAFF_ROLES } from "@/lib/enums";

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  return (
    <aside className="h-fit rounded-2xl bg-panel p-4 shadow-card">
      <div className="mb-3 border-b border-cream-dark px-2 pb-3">
        <p className="text-xs text-ink-soft">Signed in as</p>
        <p className="truncate font-semibold">{name}</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-forest-700 text-white" : "hover:bg-cream-dark")}>
              <Icon size={17} /> {item.label}
            </Link>
          );
        })}
        {STAFF_ROLES.includes(role) && (
          <Link href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-forest-700 hover:bg-cream-dark">
            <Shield size={17} /> Admin dashboard
          </Link>
        )}
        <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-cream-dark">
          <LogOut size={17} /> Sign out
        </button>
      </nav>
    </aside>
  );
}
