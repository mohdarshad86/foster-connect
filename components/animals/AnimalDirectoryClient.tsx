"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimalCard, type PublicAnimal } from "@/components/animals/AnimalCard"
import { SlidersHorizontal } from "lucide-react"
import type { AnimalStatus } from "@prisma/client"

const STATUS_OPTIONS: { value: AnimalStatus | ""; label: string }[] = [
  { value: "",                label: "All Statuses"        },
  { value: "INTAKE",          label: "Intake"              },
  { value: "IN_FOSTER",       label: "In Foster"           },
  { value: "ADOPTION_READY",  label: "Adoption Ready"      },
  { value: "PENDING_ADOPTION",label: "Pending Adoption"    },
  { value: "ADOPTED",         label: "Adopted"             },
]

const SORT_OPTIONS = [
  { value: "intakeDate_desc", label: "Newest first"  },
  { value: "name_asc",        label: "Name (A–Z)"    },
]

interface Props {
  initialAnimals: PublicAnimal[]
  initialNextCursor: string | null
}

export function AnimalDirectoryClient({ initialAnimals, initialNextCursor }: Props) {
  const [animals,    setAnimals]    = useState<PublicAnimal[]>(initialAnimals)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [status,     setStatus]     = useState<AnimalStatus | "">("")
  const [species,    setSpecies]    = useState("")
  const [sort,       setSort]       = useState("intakeDate_desc")
  const [loading,    setLoading]    = useState(false)
  const [loadingMore,setLoadingMore]= useState(false)

  // Build query string helper
  function buildQuery(opts: {
    status:  AnimalStatus | ""
    species: string
    sort:    string
    cursor?: string | null
  }) {
    const p = new URLSearchParams()
    if (opts.status)  p.set("status",  opts.status)
    if (opts.species) p.set("species", opts.species)
    if (opts.sort)    p.set("sort",    opts.sort)
    if (opts.cursor)  p.set("cursor",  opts.cursor)
    p.set("take", "24")
    return p.toString()
  }

  // Re-fetch from scratch when filters/sort change
  const fetchFiltered = useCallback(async (
    newStatus: AnimalStatus | "",
    newSpecies: string,
    newSort: string,
  ) => {
    setLoading(true)
    try {
      const qs  = buildQuery({ status: newStatus, species: newSpecies, sort: newSort })
      const res = await fetch(`/api/animals?${qs}`)
      if (!res.ok) return
      const data = await res.json() as { animals: PublicAnimal[]; nextCursor: string | null }
      setAnimals(data.animals)
      setNextCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger re-fetch whenever status / species / sort change
  useEffect(() => {
    fetchFiltered(status, species, sort)
  // fetchFiltered is stable (useCallback with no deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, species, sort])

  // Load more (append next page)
  async function handleLoadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const qs  = buildQuery({ status, species, sort, cursor: nextCursor })
      const res = await fetch(`/api/animals?${qs}`)
      if (!res.ok) return
      const data = await res.json() as { animals: PublicAnimal[]; nextCursor: string | null }
      setAnimals((prev) => [...prev, ...data.animals])
      setNextCursor(data.nextCursor)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Filter / sort bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AnimalStatus | "")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by species…"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-44"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400 animate-pulse">Loading animals…</p>
        </div>
      ) : animals.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-400">No animals found.</p>
          {(status || species) && (
            <button
              onClick={() => { setStatus(""); setSpecies("") }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {animals.map((a) => (
            <AnimalCard key={a.id} animal={a} />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
