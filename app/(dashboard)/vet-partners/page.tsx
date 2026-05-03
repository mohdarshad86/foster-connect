import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VetPartnerManager } from "@/components/vet-partners/VetPartnerManager"
import type { Role } from "@prisma/client"

export default async function VetPartnersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user.role as Role) !== "RESCUE_LEAD") redirect("/dashboard")

  const partners = await prisma.vetPartner.findMany({
    orderBy: { createdAt: "desc" },
    include: { addedBy: { select: { name: true } } },
  })

  // Serialize dates for client component
  const serialized = partners.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vet Partners</h1>
        <p className="text-sm text-slate-500 mt-1">
          Veterinary clinic contact directory — no login access.
        </p>
      </div>
      <VetPartnerManager initial={serialized} />
    </div>
  )
}
