import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { FileText, PawPrint, ArrowLeft, ArrowRight } from "lucide-react"

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ page?: string; animalId?: string }>
}

export default async function MyNotesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "FOSTER_PARENT") redirect("/dashboard")

  const { page: pageParam, animalId: filterAnimalId } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const whereBase = {
    fosterParentId: session.user.id,
    ...(filterAnimalId ? { animalId: filterAnimalId } : {}),
  }

  const [notes, total, myAnimals] = await Promise.all([
    prisma.progressNote.findMany({
      where:   whereBase,
      orderBy: { weekOf: "desc" },
      skip,
      take:    PAGE_SIZE,
      include: {
        animal: { select: { id: true, name: true, species: true } },
      },
    }),

    prisma.progressNote.count({ where: whereBase }),

    prisma.animal.findMany({
      where:   { fosterParentId: session.user.id },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageHref(p: number) {
    const q = new URLSearchParams()
    q.set("page", String(p))
    if (filterAnimalId) q.set("animalId", filterAnimalId)
    return `/my-notes?${q.toString()}`
  }

  function animalHref(id: string | undefined) {
    const q = new URLSearchParams()
    if (id) q.set("animalId", id)
    return `/my-notes?${q.toString()}`
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Progress Notes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total === 0 ? "No notes yet." : `${total} note${total !== 1 ? "s" : ""} across all animals`}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {/* Animal filter */}
      {myAnimals.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={animalHref(undefined)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !filterAnimalId
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All animals
          </Link>
          {myAnimals.map((a) => (
            <Link
              key={a.id}
              href={animalHref(a.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterAnimalId === a.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {a.name}
            </Link>
          ))}
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {filterAnimalId ? "No notes for this animal." : "You haven't submitted any progress notes yet."}
          </p>
          {myAnimals.length > 0 && (
            <Link
              href={`/animals/${myAnimals[0].id}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              <PawPrint className="w-4 h-4" />
              Go to an animal profile to add a note
            </Link>
          )}
        </div>
      ) : (
        <ol className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/animals/${note.animal.id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                  >
                    <PawPrint className="w-3.5 h-3.5" />
                    {note.animal.name}
                    <span className="text-slate-400 font-normal">· {note.animal.species}</span>
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Week of {formatDate(note.weekOf)}
                  </p>
                </div>
                {note.weightKg != null && (
                  <span className="shrink-0 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {note.weightKg} kg
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {note.noteText}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
