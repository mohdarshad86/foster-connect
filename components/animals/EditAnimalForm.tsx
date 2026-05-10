"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X } from "lucide-react"

interface AnimalFields {
  name:          string
  species:       string
  breed:         string | null
  ageYears:      number | null
  sex:           string
  colorMarkings: string | null
  publicBio:     string | null
}

interface Props {
  animalId: string
  current:  AnimalFields
}

export function EditAnimalForm({ animalId, current }: Props) {
  const router = useRouter()
  const [open,   setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const [name,          setName]          = useState(current.name)
  const [species,       setSpecies]       = useState(current.species)
  const [breed,         setBreed]         = useState(current.breed ?? "")
  const [ageYears,      setAgeYears]      = useState(current.ageYears?.toString() ?? "")
  const [sex,           setSex]           = useState(current.sex)
  const [colorMarkings, setColorMarkings] = useState(current.colorMarkings ?? "")
  const [publicBio,     setPublicBio]     = useState(current.publicBio ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Name is required."); return }
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/animals/${animalId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:          name.trim(),
        species,
        breed:         breed.trim() || undefined,
        ageYears:      ageYears !== "" ? parseFloat(ageYears) : null,
        sex,
        colorMarkings: colorMarkings.trim() || undefined,
        publicBio:     publicBio.trim() || null,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? "Failed to save. Please try again.")
      return
    }

    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit Details
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Edit Animal Details</h3>
        <button
          onClick={() => { setOpen(false); setError(null) }}
          className="p-1 rounded text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Species */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Species <span className="text-red-500">*</span>
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Breed */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Breed</label>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Age */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Age (years)</label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.5"
              inputMode="decimal"
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Sex */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Sex <span className="text-red-500">*</span>
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          {/* Color / Markings */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Color / Markings</label>
            <input
              value={colorMarkings}
              onChange={(e) => setColorMarkings(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Public Bio — full width, Story 45 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Public Bio
            </label>
            <span className={`text-xs ${publicBio.length > 600 ? "text-red-500" : "text-slate-400"}`}>
              {publicBio.length}/600
            </span>
          </div>
          <textarea
            rows={3}
            value={publicBio}
            onChange={(e) => setPublicBio(e.target.value)}
            placeholder="A short introduction that appears on the public profile page…"
            maxLength={600}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <p className="text-xs text-slate-400">Visible to the public on the animal&apos;s profile page.</p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null) }}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
