import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PawPrint } from "lucide-react"
import { HomepageGrid } from "@/components/animals/HomepageGrid"

export default async function PublicHomePage() {
  const animals = await prisma.animal.findMany({
    where:   { status: "ADOPTION_READY" },
    orderBy: { intakeDate: "desc" },
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
      updatedAt:    true,                          // Story 21 — last-updated timestamp
      personalityProfile: {                        // Story 22 — trait pills
        select: { traits: true },
      },
    },
  })

  // Serialize Dates → strings for client component
  const serialized = animals.map((a) => ({
    ...a,
    intakeDate: a.intakeDate.toISOString(),
    updatedAt:  a.updatedAt.toISOString(),
  }))

  // Most recent updatedAt across all ADOPTION_READY animals (Story 21)
  const lastUpdated =
    animals.length > 0
      ? animals
          .reduce((latest, a) => (a.updatedAt > latest ? a.updatedAt : latest), animals[0].updatedAt)
          .toISOString()
      : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <PawPrint className="w-5 h-5" />
            <span className="text-slate-900">Foster Connect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/application-status"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Check application status
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-14 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Find Your Perfect Companion
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Every animal below is ready to find a loving home. Browse the list and
          apply — we&apos;ll take it from there.
        </p>
      </section>

      {/* Animal grid with filters, count, and trait pills */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <HomepageGrid animals={serialized} lastUpdated={lastUpdated} />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Foster Connect · All rights reserved
      </footer>
    </div>
  )
}
