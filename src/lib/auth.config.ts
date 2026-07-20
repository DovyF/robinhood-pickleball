import type { NextAuthConfig } from "next-auth";

// Edge-safe base config shared by middleware and the full Node-runtime auth.
// IMPORTANT: keep this file free of heavy/Node-only imports (no bcrypt, no
// Prisma, no provider `authorize` logic) so the middleware Edge bundle stays
// small. The Credentials provider that needs those is added in auth.ts.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account/login",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? "customer";
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "customer";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
