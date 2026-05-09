import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PawPrint } from "lucide-react"
import { HomepageGrid } from "@/components/animals/HomepageGrid"

// Story 32 — How Adoption Works steps (hardcoded, no CMS required)
const HOW_IT_WORKS_STEPS = [
  {
    title:       "Apply",
    description: "Fill out a short application for the animal you'd like to adopt.",
  },
  {
    title:       "Application Review",
    description: "Our adoption counselors review your application and household details.",
  },
  {
    title:       "Meet & Greet",
    description: "We arrange an in-person meeting between you and the animal.",
  },
  {
    title:       "Decision",
    description: "Our Rescue Lead reviews the counselor's recommendation and makes a final decision.",
  },
  {
    title:       "Welcome Home",
    description: "Once approved, we arrange the handover and your new companion comes home.",
  },
]

export default async function PublicHomePage() {
  const [animals, successStories] = await Promise.all([
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
              href="/faq"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              FAQ
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

      {/* Success Stories — Story 35 */}
      {successStories.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
              Happy Endings
            </h2>
            <div className="grid grid-cols-3 gap-6">
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
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            How Adoption Works
          </h2>
          <ol className="grid grid-cols-5 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
                </div>
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden absolute" aria-hidden />
                )}
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
