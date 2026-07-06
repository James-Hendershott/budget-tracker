import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/// Deliberately built from authConfig (edge-safe) and not the full
/// auth.ts — see the comment in auth.config.ts for why. This file must
/// never import Prisma or argon2.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
