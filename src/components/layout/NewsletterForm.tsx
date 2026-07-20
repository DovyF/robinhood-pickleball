"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeNewsletterAction } from "@/app/actions/newsletter";

export function NewsletterForm({ dark = true }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    await subscribeNewsletterAction(email);
    setPending(false);
    setDone(true);
  }

  if (done) {
    return (
      <p className={`inline-flex items-center gap-2 text-sm font-medium ${dark ? "text-gold-400" : "text-forest-700"}`}>
        <Check size={16} /> You&apos;re in! Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex overflow-hidden rounded-full bg-panel p-1">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="flex-1 bg-transparent px-4 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/60"
      />
      <button type="submit" disabled={pending} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-700 text-white hover:bg-forest-800 disabled:opacity-60">
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
