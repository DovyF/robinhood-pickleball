"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const res = await registerAction({
      firstName: String(fd.get("firstName")),
      lastName: String(fd.get("lastName")),
      email,
      password,
    });
    if (!res.ok) {
      setLoading(false);
      return setError(res.error ?? "Something went wrong.");
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/account");
    router.refresh();
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Create your account to track orders and check out faster"
      footer={<>Already have an account? <Link href="/account/login" className="font-semibold text-forest-700 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input name="firstName" required placeholder="First name" className="input" />
          <input name="lastName" required placeholder="Last name" className="input" />
        </div>
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className="input" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Create account"}
        </button>
        <p className="text-center text-xs text-ink-soft">By creating an account you agree to our Terms & Privacy Policy.</p>
      </form>
    </AuthCard>
  );
}
