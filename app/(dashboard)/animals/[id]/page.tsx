import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge"
import { PawPrint, ArrowLeft } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnimalProfilePage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      intakeSpecialist: { select: { name: true } },
      fosterParent:     { select: { name: true } },
      medicalAlerts:    { where: { isResolved: false }, orderBy: { createdAt: "desc" } },
    },
  })

  if (!animal) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/animals"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All animals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <PawPrint className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{animal.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {animal.species}{animal.breed ? ` · ${animal.breed}` : ""}
            </p>
          </div>
        </div>
        <AnimalStatusBadge status={animal.status} />
      </div>

      {/* Active medical alerts */}
      {animal.medicalAlerts.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-red-700">Active Medical Alert{animal.medicalAlerts.length > 1 ? "s" : ""}</p>
          {animal.medicalAlerts.map((a) => (
            <p key={a.id} className="text-sm text-red-600">{a.description}</p>
          ))}
        </div>
      )}

      {/* Details card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Intake Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sex</dt>
            <dd className="text-slate-800 mt-0.5">{animal.sex}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Age</dt>
            <dd className="text-slate-800 mt-0.5">{animal.ageYears != null ? `${animal.ageYears} yr${animal.ageYears !== 1 ? "s" : ""}` : "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Color / Markings</dt>
            <dd className="text-slate-800 mt-0.5">{animal.colorMarkings ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Intake Date</dt>
            <dd className="text-slate-800 mt-0.5">{formatDate(animal.intakeDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Intake Specialist</dt>
            <dd className="text-slate-800 mt-0.5">{animal.intakeSpecialist?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Foster Parent</dt>
            <dd className="text-slate-800 mt-0.5">{animal.fosterParent?.name ?? "Not assigned"}</dd>
          </div>
        </dl>
      </div>

      {/* Placeholder panels — filled in by future stories */}
      <div className="grid grid-cols-2 gap-4">
        {["Medical Records", "Progress Notes", "Photos", "Personality Profile"].map((section) => (
          <div
            key={section}
            className="bg-white rounded-xl border border-dashed border-slate-300 p-5 text-center"
          >
            <p className="text-xs font-medium text-slate-400">{section}</p>
            <p className="text-xs text-slate-300 mt-1">Coming in a future story</p>
          </div>
        ))}
      </div>
    </div>
  )
}
