import type { NextAuthConfig } from "next-auth"
import type { Role } from "@prisma/client"

/**
 * Edge-compatible auth config — no Node.js-specific APIs (bcryptjs, Prisma).
 * Used by middleware.ts for JWT verification only.
 * The full config (with Credentials provider + database) lives in lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as Role
      session.user.mustChangePassword = token.mustChangePassword as boolean
      return session
    },
    authorized({ auth }) {
      // Base check — fine-grained role checks are in middleware.ts
      return !!auth?.user
    },
  },

  providers: [],
} satisfies NextAuthConfig
