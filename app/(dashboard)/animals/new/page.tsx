import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { PlusCircle } from "lucide-react"
import { IntakeForm } from "@/components/animals/IntakeForm"

// Route-level role guard (middleware handles the redirect; this is a belt-and-suspenders check)
const ALLOWED_ROLES: Role[] = ["INTAKE_SPECIALIST", "RESCUE_LEAD"]

export default async function NewAnimalPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!ALLOWED_ROLES.includes(session.user.role as Role)) redirect("/dashboard")

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <PlusCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Animal Intake</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record a new animal arriving at the rescue.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <IntakeForm />
      </div>
    </div>
  )
}
