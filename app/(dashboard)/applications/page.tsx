import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ACTIVE_APPLICATION_STATUSES } from "@/lib/statusMachine"
import { ApplicationTable } from "@/components/applications/ApplicationTable"
import type { Role } from "@prisma/client"

export default async function ApplicationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = session.user.role as Role
  if (role !== "ADOPTION_COUNSELOR" && role !== "RESCUE_LEAD") {
    redirect("/dashboard")
  }

  // Server-render initial "active" tab (SUBMITTED + UNDER_REVIEW)
  const applications = await prisma.adopterApplication.findMany({
    where:   { status: { in: ACTIVE_APPLICATION_STATUSES } },
    orderBy: { submittedAt: "desc" },
    select: {
      id:             true,
      applicantName:  true,
      applicantEmail: true,
      status:         true,
      submittedAt:    true,
      counselor: { select: { id: true, name: true } },
      animal:    { select: { id: true, name: true } },
    },
  })

  // Serialize dates
  const initial = applications.map((a) => ({
    ...a,
    submittedAt: a.submittedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and screen adoption applications
        </p>
      </div>

      <ApplicationTable initialApplications={initial} initialTab="active" />
    </div>
  )
}
