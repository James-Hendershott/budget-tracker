import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { authConfig } from "@/auth.config";

/// No adapter here on purpose: the Credentials provider is incompatible
/// with NextAuth's database-session/adapter model (it can't represent a
/// password grant as a linked OAuth account), and this app only ever has
/// the two seeded accounts — no OAuth, no dynamic sign-up. JWT sessions
/// are sufficient and simpler.
///
/// This file (unlike auth.config.ts) imports Prisma and argon2, so it
/// must only ever be imported from Node-runtime code (Server Components,
/// Server Actions, the /api/auth route handler) — never from
/// middleware.ts, which Next.js runs on the Edge runtime.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const passwordValid = await argon2.verify(user.passwordHash, password);

        if (!passwordValid) {
          const failedLoginAttempts = user.failedLoginAttempts + 1;
          const lockingOut = failedLoginAttempts >= MAX_FAILED_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: lockingOut ? 0 : failedLoginAttempts,
              lockedUntil: lockingOut
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
                : null,
            },
          });
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          person: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.person = user.person;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.person = token.person as "JAMES" | "SAVANAH";
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
});
