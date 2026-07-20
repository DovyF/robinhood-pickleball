import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/account/AddressManager";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return <AddressManager addresses={addresses.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} />;
}
