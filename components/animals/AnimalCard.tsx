import Link from "next/link"
import { PawPrint } from "lucide-react"
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge"
import type { AnimalStatus } from "@prisma/client"

/** Public-only shape — no private fields exposed */
export interface PublicAnimal {
  id:           string
  name:         string
  species:      string
  breed:        string | null
  ageYears:     number | null
  sex:          string
  status:       AnimalStatus
  intakeDate:   string | Date
  primaryPhoto: string | null
}

interface Props {
  animal: PublicAnimal
  href?:  string
}

export function AnimalCard({ animal, href }: Props) {
  return (
    <Link
      href={href ?? `/animals/${animal.id}`}
      className="group block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
    >
      {/* Photo */}
      <div className="aspect-[4/3] bg-blue-50 flex items-center justify-center overflow-hidden">
        {animal.primaryPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${animal.primaryPhoto}`}
            alt={animal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <PawPrint className="w-12 h-12 text-blue-200" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {animal.name}
          </h3>
          <AnimalStatusBadge status={animal.status} />
        </div>

        <p className="text-sm text-slate-500 truncate">
          {animal.species}{animal.breed ? ` · ${animal.breed}` : ""}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{animal.sex}</span>
          {animal.ageYears != null && (
            <>
              <span>·</span>
              <span>
                {animal.ageYears} yr{animal.ageYears !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
