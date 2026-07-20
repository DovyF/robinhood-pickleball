"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Search, User, Heart, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { CartButton } from "@/components/layout/CartButton";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  url: string;
  children?: { label: string; url: string }[];
}

export function Header({ nav }: { nav: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 transition-shadow", scrolled ? "shadow-card bg-cream/95 backdrop-blur" : "bg-cream")}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark">
            <Menu size={22} />
          </button>
        </div>

        <Logo className="lg:flex-none" />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {nav.map((item) => (
            <div key={item.url} className="group relative">
              <Link href={item.url} className="text-sm font-semibold text-ink hover:text-forest-700 transition py-2">
                {item.label}
              </Link>
              {item.children && item.children.length > 0 && (
                <div className="invisible absolute left-1/2 top-full -translate-x-1/2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="mt-1 min-w-48 rounded-xl bg-panel p-2 shadow-lift">
                    {item.children.map((c) => (
                      <Link key={c.url} href={c.url} className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark">
            <Search size={20} />
          </button>
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark">
            <Heart size={20} />
          </Link>
          <Link href="/account" aria-label="Account" className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark">
            <User size={20} />
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-ink/40 transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")} onClick={() => setMobileOpen(false)} />
        <div className={cn("absolute left-0 top-0 h-full w-80 max-w-[85%] bg-cream p-5 transition-transform", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="mb-6 flex items-center justify-between">
            <Logo />
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream-dark">
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link key={item.url} href={item.url} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-base font-semibold hover:bg-cream-dark">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-1 border-t border-cream-dark pt-4">
            <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 hover:bg-cream-dark">
              Account
            </Link>
            <Link href="/account/wishlist" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 hover:bg-cream-dark">
              Wishlist
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 hover:bg-cream-dark">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
