import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { AnimalCard } from "@/components/animals/AnimalCard"
import { PawPrint } from "lucide-react"

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
    },
  })

  const serialized = animals.map((a) => ({
    ...a,
    intakeDate: a.intakeDate.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <PawPrint className="w-5 h-5" />
            <span className="text-slate-900">Foster Connect</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Staff Login
          </Link>
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

      {/* Animal grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {serialized.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center">
            <PawPrint className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No animals available right now.</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon — new arrivals are added regularly.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5">
              {serialized.length} animal{serialized.length !== 1 ? "s" : ""} available for adoption
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {serialized.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  href={`/apply/${animal.id}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Foster Connect · All rights reserved
      </footer>
    </div>
  )
}
