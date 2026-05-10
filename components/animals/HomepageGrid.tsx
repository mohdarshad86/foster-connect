"use client";

import { useState, useMemo } from "react";
import { X, PawPrint, SlidersHorizontal } from "lucide-react";
import { AnimalCard, type PublicAnimal } from "@/components/animals/AnimalCard";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicAnimalWithTraits extends PublicAnimal {
  updatedAt: string;
  personalityProfile: { traits: string[] } | null;
}

type SpeciesFilter = "All" | "Dog" | "Cat" | "Other";
type AgeFilter = "Any" | "Puppy or Kitten" | "Young" | "Adult" | "Senior";

interface Filters {
  species: SpeciesFilter;
  breed: string;
  age: AgeFilter;
}

const DEFAULT_FILTERS: Filters = { species: "All", breed: "", age: "Any" };

// ─── Filter helpers ───────────────────────────────────────────────────────────

function matchesSpecies(species: string, filter: SpeciesFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Other")
    return !["dog", "cat"].includes(species.toLowerCase());
  return species.toLowerCase() === filter.toLowerCase();
}

function matchesAge(ageYears: number | null, filter: AgeFilter): boolean {
  if (filter === "Any" || ageYears === null) return true;
  if (filter === "Puppy or Kitten") return ageYears < 1;
  if (filter === "Young") return ageYears >= 1 && ageYears <= 3;
  if (filter === "Adult") return ageYears >= 4 && ageYears <= 8;
  if (filter === "Senior") return ageYears >= 9;
  return true;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  animals: PublicAnimalWithTraits[];
  lastUpdated: string | null;
}

export function HomepageGrid({ animals, lastUpdated }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.species !== "All" || filters.breed !== "" || filters.age !== "Any";

  const filtered = useMemo(
    () =>
      animals.filter((a) => {
        if (!matchesSpecies(a.species, filters.species)) return false;
        if (
          filters.breed &&
          !a.breed?.toLowerCase().includes(filters.breed.toLowerCase())
        )
          return false;
        if (!matchesAge(a.ageYears, filters.age)) return false;
        return true;
      }),
    [animals, filters],
  );

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const countLabel = hasActiveFilters
    ? `${filtered.length} of ${animals.length} animals match your filters`
    : `${animals.length} animal${animals.length !== 1 ? "s" : ""} available for adoption`;

  return (
    <div className="space-y-5">
      {/* ── Filter panel ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
          <SlidersHorizontal className="w-4 h-4" />
          Filter animals
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {/* Species */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              Species
            </label>
            <select
              value={filters.species}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  species: e.target.value as SpeciesFilter,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All species</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Breed */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Breed</label>
            <input
              type="text"
              placeholder="Search breed…"
              value={filters.breed}
              onChange={(e) =>
                setFilters((f) => ({ ...f, breed: e.target.value }))
              }
              className="w-full sm:w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Age range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              Age range
            </label>
            <select
              value={filters.age}
              onChange={(e) =>
                setFilters((f) => ({ ...f, age: e.target.value as AgeFilter }))
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Any">Any age</option>
              <option value="Puppy or Kitten">
                Puppy or Kitten (&lt;1 yr)
              </option>
              <option value="Young">Young (1–3 yrs)</option>
              <option value="Adult">Adult (4–8 yrs)</option>
              <option value="Senior">Senior (9+ yrs)</option>
            </select>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.species !== "All" && (
              <Badge variant="blue">Species: {filters.species}</Badge>
            )}
            {filters.breed && (
              <Badge variant="blue">Breed: &quot;{filters.breed}&quot;</Badge>
            )}
            {filters.age !== "Any" && (
              <Badge variant="blue">Age: {filters.age}</Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Count + last updated ── */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{countLabel}</span>
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            Last updated {formatRelativeTime(lastUpdated)}
          </span>
        )}
      </div>

      {/* ── Grid or empty state ── */}
      {filtered.length === 0 ? (
        animals.length === 0 ? (
          /* No animals at all */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center">
            <PawPrint className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              No animals available right now.
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Check back soon — new arrivals are added regularly.
            </p>
          </div>
        ) : (
          /* Animals exist but filters exclude all */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center">
            <SlidersHorizontal className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              No animals match your filters — try adjusting your search.
            </p>
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              href={`/public-animals/${animal.id}`}
              traits={animal.personalityProfile?.traits ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
