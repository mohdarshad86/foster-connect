import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"
import { authConfig } from "@/auth.config"

// ---------------------------------------------------------------------------
// Type augmentation — add role + mustChangePassword to session
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      mustChangePassword: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    mustChangePassword: boolean
  }
}

// ---------------------------------------------------------------------------
// Full NextAuth v5 config — Node.js runtime only (bcryptjs + Prisma)
// Middleware uses auth.config.ts (edge-safe) via a separate NextAuth instance.
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        // Inactive accounts are treated the same as not found
        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
