"use client";

import { signOut } from "next-auth/react";
import { LogOut, ExternalLink } from "lucide-react";

export function AdminTopbar({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cream-dark bg-panel/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <p className="text-sm text-ink-soft lg:hidden">Robinhood Admin</p>
      <div className="ml-auto flex items-center gap-3">
        <a href="/" target="_blank" className="hidden items-center gap-1.5 text-sm text-ink-soft hover:text-forest-700 sm:flex">
          <ExternalLink size={15} /> View store
        </a>
        <span className="text-sm font-medium text-ink">{name}</span>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-cream-dark" aria-label="Sign out">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
