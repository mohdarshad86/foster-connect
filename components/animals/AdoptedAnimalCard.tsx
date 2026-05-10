import { PawPrint, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdoptedAnimal {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  ageYears: number | null;
  sex: string;
  primaryPhoto: string | null;
  /** Serialised ISO string of the date status moved to ADOPTED, or null */
  adoptedAt: string | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatAdoptionMonth(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Read-only card for an animal that has already been adopted.
 * Intentionally has no link / CTA — the animal is no longer available.
 */
export function AdoptedAnimalCard({ animal }: { animal: AdoptedAnimal }) {
  const adoptionMonth = formatAdoptionMonth(animal.adoptedAt);

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
      {/* Photo */}
      <div className="aspect-[4/3] bg-emerald-50 flex items-center justify-center overflow-hidden relative">
        {animal.primaryPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${animal.primaryPhoto}`}
            alt={animal.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <PawPrint className="w-12 h-12 text-emerald-200" />
        )}

        {/* "Successfully Adopted" overlay badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-900/70 to-transparent px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            Successfully Adopted
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-1.5">
        <h3 className="font-semibold text-slate-900 truncate">{animal.name}</h3>

        <p className="text-sm text-slate-500 truncate">
          {animal.species}
          {animal.breed ? ` · ${animal.breed}` : ""}
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

        {adoptionMonth && (
          <p className="text-xs text-emerald-600 font-medium pt-0.5">
            Adopted {adoptionMonth}
          </p>
        )}
      </div>
    </div>
  );
}
