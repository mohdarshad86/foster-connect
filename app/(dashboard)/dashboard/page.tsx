import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { RescueLeadDashboard } from "@/components/dashboards/RescueLeadDashboard"
import { IntakeSpecialistDashboard } from "@/components/dashboards/IntakeSpecialistDashboard"
import { FosterParentDashboard } from "@/components/dashboards/FosterParentDashboard"
import { MedicalOfficerDashboard } from "@/components/dashboards/MedicalOfficerDashboard"
import { AdoptionCounselorDashboard } from "@/components/dashboards/AdoptionCounselorDashboard"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = session.user.role as Role
  const userId = session.user.id as string

  switch (role) {
    case "RESCUE_LEAD":
      return <RescueLeadDashboard />

    case "INTAKE_SPECIALIST":
      return <IntakeSpecialistDashboard />

    case "FOSTER_PARENT":
      return <FosterParentDashboard userId={userId} />

    case "MEDICAL_OFFICER":
      return <MedicalOfficerDashboard />

    case "ADOPTION_COUNSELOR":
      return <AdoptionCounselorDashboard userId={userId} />

    default:
      redirect("/login")
  }
}
