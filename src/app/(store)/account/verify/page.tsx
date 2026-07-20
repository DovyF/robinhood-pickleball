import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAction } from "@/app/actions/auth";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false };

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      {result.ok ? (
        <>
          <CheckCircle2 size={56} className="text-forest-600" />
          <h1 className="mt-4 text-2xl font-extrabold">Email verified!</h1>
          <p className="mt-2 text-ink-soft">Thanks for confirming your email address.</p>
        </>
      ) : (
        <>
          <XCircle size={56} className="text-red-500" />
          <h1 className="mt-4 text-2xl font-extrabold">Verification failed</h1>
          <p className="mt-2 text-ink-soft">This link is invalid or has expired.</p>
        </>
      )}
      <Link href="/account" className="btn btn-primary mt-6">Go to my account</Link>
    </div>
  );
}
