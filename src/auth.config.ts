import type { NextAuthConfig } from "next-auth";

/// Edge-safe half of the auth config. This is the only piece imported by
/// middleware.ts (which Next.js always runs on the Edge runtime) — it
/// must never pull in Prisma (needs the Node `pg` driver) or argon2
/// (native bindings). The Credentials provider and its Prisma-backed
/// authorize() live in auth.ts instead, imported only where Node runtime
/// is guaranteed (Server Components, Server Actions, the API route).
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isLoginPage = nextUrl.pathname === "/login";

      if (isAuthRoute) return true;
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl.origin));
      }
      if (!isLoggedIn && !isLoginPage) return false; // -> redirects to pages.signIn
      return true;
    },
  },
} satisfies NextAuthConfig;
