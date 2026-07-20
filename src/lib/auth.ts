import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/enums";
import { authConfig } from "@/lib/auth.config";

// Auth.js v5 full config (Node runtime). Extends the Edge-safe base config in
// auth.config.ts with the Credentials provider, which needs Prisma + bcrypt.
// Uses JWT session strategy; roles are carried in the token (see auth.config
// callbacks) so middleware/pages can gate access.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email || "").toLowerCase().trim();
        const password = String(creds?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.firstName ?? user.email,
          role: user.role,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
});

export function isStaff(role?: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
