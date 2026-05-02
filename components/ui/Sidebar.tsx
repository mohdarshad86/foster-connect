import Link from "next/link"
import type { Role } from "@prisma/client"
import {
  LayoutDashboard,
  PawPrint,
  PlusCircle,
  ClipboardList,
  Users,
  Stethoscope,
} from "lucide-react"
import { LogoutButton } from "@/components/ui/LogoutButton"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Role label & colour mapping
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<Role, string> = {
  RESCUE_LEAD:       "Rescue Lead",
  INTAKE_SPECIALIST: "Intake Specialist",
  FOSTER_PARENT:     "Foster Parent",
  MEDICAL_OFFICER:   "Medical Officer",
  ADOPTION_COUNSELOR: "Adoption Counselor",
}

const ROLE_BADGE_COLOURS: Record<Role, string> = {
  RESCUE_LEAD:        "bg-purple-100 text-purple-700",
  INTAKE_SPECIALIST:  "bg-blue-100 text-blue-700",
  FOSTER_PARENT:      "bg-green-100 text-green-700",
  MEDICAL_OFFICER:    "bg-red-100 text-red-700",
  ADOPTION_COUNSELOR: "bg-yellow-100 text-yellow-700",
}

// ---------------------------------------------------------------------------
// Nav items per role
// ---------------------------------------------------------------------------

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href:  "/dashboard",
    icon:  <LayoutDashboard className="w-4 h-4" />,
    roles: [
      "RESCUE_LEAD",
      "INTAKE_SPECIALIST",
      "FOSTER_PARENT",
      "MEDICAL_OFFICER",
      "ADOPTION_COUNSELOR",
    ],
  },
  {
    label: "Animals",
    href:  "/animals",
    icon:  <PawPrint className="w-4 h-4" />,
    roles: [
      "RESCUE_LEAD",
      "INTAKE_SPECIALIST",
      "FOSTER_PARENT",
      "MEDICAL_OFFICER",
      "ADOPTION_COUNSELOR",
    ],
  },
  {
    label: "New Intake",
    href:  "/animals/new",
    icon:  <PlusCircle className="w-4 h-4" />,
    roles: ["RESCUE_LEAD", "INTAKE_SPECIALIST"],
  },
  {
    label: "Applications",
    href:  "/applications",
    icon:  <ClipboardList className="w-4 h-4" />,
    roles: ["RESCUE_LEAD", "ADOPTION_COUNSELOR"],
  },
  {
    label: "Vet Partners",
    href:  "/vet-partners",
    icon:  <Stethoscope className="w-4 h-4" />,
    roles: ["RESCUE_LEAD"],
  },
  {
    label: "Users",
    href:  "/users",
    icon:  <Users className="w-4 h-4" />,
    roles: ["RESCUE_LEAD"],
  },
]

// ---------------------------------------------------------------------------
// NavLink — active state is handled client-side; server renders base styles
// ---------------------------------------------------------------------------

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Sidebar (Server Component — receives props from layout)
// ---------------------------------------------------------------------------

interface SidebarProps {
  role: Role
  userName: string
}

export function Sidebar({ role, userName }: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen bg-white border-r border-slate-200 sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <PawPrint className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm">Foster Connect</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
              ROLE_BADGE_COLOURS[role]
            )}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
