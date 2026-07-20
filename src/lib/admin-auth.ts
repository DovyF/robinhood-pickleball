import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { STAFF_ROLES, ADMIN_ROLES } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

/** Require a staff+ session for admin pages/actions. Redirects if not allowed. */
export async function requireStaff() {
  const session = await auth();
  if (!session?.user) redirect("/account/login?callbackUrl=/admin");
  if (!STAFF_ROLES.includes(session.user.role)) redirect("/");
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    throw new Error("Forbidden: admin access required");
  }
  return session;
}

/** For server actions — throws instead of redirecting. */
export async function assertStaff() {
  const session = await auth();
  if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function logAudit(action: string, entity?: string, entityId?: string, detail?: string) {
  const session = await auth();
  await prisma.auditLog
    .create({ data: { userId: session?.user?.id, action, entity, entityId, detail } })
    .catch(() => {});
}
