"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

/**
 * Thin wrapper that lets us import SessionProvider from a Client Component file
 * while keeping app/layout.tsx a Server Component.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
