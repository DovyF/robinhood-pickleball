import { requireStaff } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[248px_1fr]">
      <AdminSidebar role={session.user.role} />
      <div className="flex min-h-screen flex-col">
        <AdminTopbar name={session.user.name ?? session.user.email ?? "Staff"} />
        <main className="flex-1 bg-cream p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
