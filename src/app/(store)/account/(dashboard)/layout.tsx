import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/account/login?callbackUrl=/account");

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-3xl font-extrabold">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountNav name={session.user.name ?? session.user.email ?? "Account"} role={session.user.role} />
        <div>{children}</div>
      </div>
    </div>
  );
}
