"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) return setError("Invalid email or password.");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={<>New here? <Link href="/account/register" className="font-semibold text-forest-700 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="password" type="password" required placeholder="Password" className="input" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Link href="/account/forgot" className="text-sm text-forest-700 hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
