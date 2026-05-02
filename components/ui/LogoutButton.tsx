"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600",
        "rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors",
        className
      )}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sign out
    </button>
  )
}
