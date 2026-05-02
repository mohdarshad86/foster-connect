import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Badge, type BadgeVariant } from "@/components/ui/Badge"
import { CreateUserForm } from "@/components/users/CreateUserForm"
import { ToggleActiveButton } from "@/components/users/ToggleActiveButton"
import type { Role } from "@prisma/client"

const ROLE_LABELS: Record<Role, string> = {
  RESCUE_LEAD:        "Rescue Lead",
  INTAKE_SPECIALIST:  "Intake Specialist",
  FOSTER_PARENT:      "Foster Parent",
  MEDICAL_OFFICER:    "Medical Officer",
  ADOPTION_COUNSELOR: "Adoption Counselor",
}

const ROLE_BADGE_VARIANTS: Record<Role, BadgeVariant> = {
  RESCUE_LEAD:        "purple",
  INTAKE_SPECIALIST:  "blue",
  FOSTER_PARENT:      "green",
  MEDICAL_OFFICER:    "red",
  ADOPTION_COUNSELOR: "yellow",
}

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "RESCUE_LEAD") redirect("/dashboard")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      isActive:  true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">
          {users.length} account{users.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      {/* Create user form */}
      <CreateUserForm />

      {/* User list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No users registered yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {user.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <Badge variant={ROLE_BADGE_VARIANTS[user.role as Role]}>
                      {ROLE_LABELS[user.role as Role]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        user.isActive
                          ? "text-green-700 text-xs font-medium"
                          : "text-slate-400 text-xs font-medium"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ToggleActiveButton
                      userId={user.id}
                      isActive={user.isActive}
                      isSelf={user.id === session.user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
