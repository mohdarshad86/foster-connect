import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PawPrint, CheckCircle2 } from "lucide-react"
import { HomepageGrid } from "@/components/animals/HomepageGrid"
import { AdoptedAnimalCard, type AdoptedAnimal } from "@/components/animals/AdoptedAnimalCard"
import { HOW_IT_WORKS_STEPS } from "@/lib/constants"

export default async function PublicHomePage() {
  const [animals, adoptedAnimalsRaw, successStories] = await Promise.all([
    // Section 1 — animals ready for adoption
    prisma.animal.findMany({
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
    }),

    // Section 2 — recently adopted animals (most recent 8)
    prisma.animal.findMany({
      where:   { status: "ADOPTED" },
      orderBy: { updatedAt: "desc" },
      take:    8,
      select: {
        id:            true,
        name:          true,
        species:       true,
        breed:         true,
        ageYears:      true,
        sex:           true,
        primaryPhoto:  true,
        statusHistory: true,   // used to extract the adoption date
      },
    }),

    // Story 35 — published success stories for homepage
    prisma.successStory.findMany({
      where:   { isPublished: true },
      orderBy: { createdAt: "desc" },
      take:    6,
      select: {
        id:            true,
        animalName:    true,
        photoUrl:      true,
        blurb:         true,
        adoptionMonth: true,
      },
    }),
  ])

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

  // Extract the adoption date from statusHistory for each adopted animal
  const adoptedAnimals: AdoptedAnimal[] = adoptedAnimalsRaw.map((a) => {
    const adoptedEntry = a.statusHistory
      .filter((h) => h.to === "ADOPTED")
      .sort((x, y) => new Date(y.changedAt).getTime() - new Date(x.changedAt).getTime())[0]

    return {
      id:           a.id,
      name:         a.name,
      species:      a.species,
      breed:        a.breed,
      ageYears:     a.ageYears,
      sex:          a.sex,
      primaryPhoto: a.primaryPhoto,
      adoptedAt:    adoptedEntry ? new Date(adoptedEntry.changedAt).toISOString() : null,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <PawPrint className="w-5 h-5" />
            <span className="text-slate-900">Foster Connect</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/application-status"
              className="hidden sm:inline text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Check status
            </Link>
            <Link
              href="/faq"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 sm:px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Find Your Perfect Companion
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Every animal below is ready to find a loving home. Browse the list and
          apply — we&apos;ll take it from there.
        </p>
        <a
          href="#animals"
          className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PawPrint className="w-4 h-4" />
          Browse Animals
        </a>
      </section>

      {/* Animal grid with filters, count, and trait pills */}
      <section id="animals" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <HomepageGrid animals={serialized} lastUpdated={lastUpdated} />
      </section>

      {/* Recently Adopted — Section 2 */}
      {adoptedAnimals.length > 0 && (
        <section className="bg-emerald-50 border-t border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            {/* Section header */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Forever homes found
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Recently Adopted
              </h2>
              <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
                These animals have already found their forever families — thanks to
                people like you.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {adoptedAnimals.map((animal) => (
                <AdoptedAnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Success Stories — Story 35 */}
      {successStories.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
              Happy Endings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {successStories.map((story) => (
                <div key={story.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {story.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/uploads/${story.photoUrl}`}
                      alt={story.animalName}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-blue-50 flex items-center justify-center">
                      <PawPrint className="w-12 h-12 text-blue-200" />
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-base font-semibold text-slate-900">{story.animalName}</p>
                      <span className="text-xs text-slate-400 shrink-0">{story.adoptionMonth}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {story.blurb}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How Adoption Works — Story 32 */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            How Adoption Works
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-0">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={i} className="flex flex-col items-center text-center gap-3 px-4 relative">
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <span
                    className="hidden lg:block absolute top-5 left-[calc(50%+20px)] right-[-calc(50%-20px)] h-px bg-blue-200 w-[calc(100%-40px)]"
                    aria-hidden
                  />
                )}
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 relative z-10">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Foster Connect · All rights reserved
      </footer>
    </div>
  )
}
