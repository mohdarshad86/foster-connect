import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/ui/Sidebar"
import { MobileNav } from "@/components/ui/MobileNav"
import type { Role } from "@prisma/client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role     = session.user.role as Role
  const userName = session.user.name ?? "User"

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile: fixed top bar + slide-in drawer */}
      <MobileNav role={role} userName={userName} />

      {/* Desktop: permanent sidebar (hidden on mobile via Sidebar's hidden md:flex) */}
      <Sidebar role={role} userName={userName} />

      {/* Main content — pt-14 on mobile to clear the fixed top bar */}
      <main className="flex-1 min-w-0 p-4 pt-18 md:p-8 md:pt-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
