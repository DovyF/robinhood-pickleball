"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { requestPasswordResetAction } from "@/app/actions/auth";

export default function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await requestPasswordResetAction(String(fd.get("email")));
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to reset it"
      footer={<Link href="/account/login" className="font-semibold text-forest-700 hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <MailCheck size={40} className="text-forest-600" />
          <p className="text-ink-soft">If an account exists for that email, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="input" />
          <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
