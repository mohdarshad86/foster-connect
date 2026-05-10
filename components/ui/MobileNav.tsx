"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Role } from "@prisma/client"
import { PawPrint, Menu, X } from "lucide-react"
import { LogoutButton } from "@/components/ui/LogoutButton"
import { cn } from "@/lib/utils"
import {
  NAV_ITEMS,
  getActiveHref,
  isMatchingRoute,
  type NavItem,
} from "@/components/ui/Sidebar"

const ROLE_LABELS: Record<Role, string> = {
  RESCUE_LEAD:        "Rescue Lead",
  INTAKE_SPECIALIST:  "Intake Specialist",
  FOSTER_PARENT:      "Foster Parent",
  MEDICAL_OFFICER:    "Medical Officer",
  ADOPTION_COUNSELOR: "Adoption Counselor",
}

const ROLE_BADGE_COLOURS: Record<Role, string> = {
  RESCUE_LEAD:        "bg-purple-100 text-purple-700",
  INTAKE_SPECIALIST:  "bg-blue-100 text-blue-700",
  FOSTER_PARENT:      "bg-green-100 text-green-700",
  MEDICAL_OFFICER:    "bg-red-100 text-red-700",
  ADOPTION_COUNSELOR: "bg-yellow-100 text-yellow-700",
}

interface Props {
  role:     Role
  userName: string
}

export function MobileNav({ role, userName }: Props) {
  const pathname     = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const visibleItems = NAV_ITEMS.filter((item: NavItem) => item.roles.includes(role))
  const activeHref   = getActiveHref(pathname, visibleItems)

  return (
    <>
      {/* ── Fixed top bar (mobile only) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <PawPrint className="w-5 h-5" />
          <span className="text-slate-900 text-sm">Foster Connect</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* ── Overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in drawer ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-64 z-50 bg-white shadow-xl flex flex-col transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <PawPrint className="w-5 h-5" />
            <span className="text-slate-900 text-sm">Foster Connect</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item: NavItem) => {
            const isActive = isMatchingRoute(pathname, item.href) && item.href === activeHref
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm min-h-[44px]",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-1">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                ROLE_BADGE_COLOURS[role],
              )}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </>
  )
}
