import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PlusCircle } from "lucide-react"
import { AnimalDirectoryClient } from "@/components/animals/AnimalDirectoryClient"
import type { PublicAnimal } from "@/components/animals/AnimalCard"
import type { Role } from "@prisma/client"

const INTAKE_ROLES: Role[] = ["INTAKE_SPECIALIST", "RESCUE_LEAD"]

export default async function AnimalsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const canIntake = INTAKE_ROLES.includes(session.user.role as Role)

  // Server-side initial load: first 24 animals, newest first
  const raw = await prisma.animal.findMany({
    orderBy: { intakeDate: "desc" },
    take: 25, // fetch one extra to detect next page
    select: {
      id:           true,
      name:         true,
      species:      true,
      breed:        true,
      ageYears:     true,
      sex:          true,
      status:       true,
      intakeDate:   true,
      primaryPhoto: true,
    },
  })

  const hasMore       = raw.length > 24
  const initialPage   = hasMore ? raw.slice(0, 24) : raw
  const initialCursor = hasMore ? initialPage[initialPage.length - 1].id : null

  // Serialize dates so they survive the server → client boundary
  const initialAnimals: PublicAnimal[] = initialPage.map((a) => ({
    ...a,
    intakeDate: a.intakeDate.toISOString(),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Animals</h1>
          <p className="text-sm text-slate-500 mt-1">Browse all animals in the rescue</p>
        </div>
        {canIntake && (
          <Link
            href="/animals/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Intake
          </Link>
        )}
      </div>

      {/* Directory — client component owns filters, sort, and pagination */}
      <AnimalDirectoryClient
        initialAnimals={initialAnimals}
        initialNextCursor={initialCursor}
      />
    </div>
  )
}
