"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    if (password !== String(fd.get("confirm"))) {
      setLoading(false);
      return setError("Passwords don't match.");
    }
    const res = await resetPasswordAction({ token, password });
    setLoading(false);
    if (!res.ok) return setError(res.error ?? "Something went wrong.");
    setDone(true);
    setTimeout(() => router.push("/account/login"), 1500);
  }

  return (
    <AuthCard title="Choose a new password" footer={<Link href="/account/login" className="font-semibold text-forest-700 hover:underline">Back to sign in</Link>}>
      {done ? (
        <p className="py-4 text-center text-forest-700">Password updated! Redirecting to sign in…</p>
      ) : !token ? (
        <p className="text-red-600">Missing reset token. Please use the link from your email.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input name="password" type="password" required minLength={8} placeholder="New password" className="input" />
          <input name="confirm" type="password" required placeholder="Confirm password" className="input" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Update password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPage() {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}
