"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TagSelect } from "@/components/ui/TagSelect"
import type { PersonalityProfile } from "@prisma/client"

const TRAIT_OPTIONS = [
  "Playful", "Calm", "Affectionate", "Independent", "Curious",
  "Energetic", "Gentle", "Shy", "Social", "Protective",
  "Adaptable", "Loyal", "Vocal", "Mellow", "Intelligent",
]

const ENERGY_OPTIONS = ["Low", "Medium", "High"]

type Ternary = "true" | "false" | "unknown"

function toBool(v: Ternary): boolean | null {
  if (v === "true")  return true
  if (v === "false") return false
  return null
}

function fromBool(v: boolean | null | undefined): Ternary {
  if (v === true)  return "true"
  if (v === false) return "false"
  return "unknown"
}

interface Props {
  animalId: string
  profile:  PersonalityProfile | null
}

export function PersonalityProfileForm({ animalId, profile }: Props) {
  const router  = useRouter()
  const [traits,       setTraits]       = useState<string[]>(profile?.traits       ?? [])
  const [energyLevel,  setEnergyLevel]  = useState<string>(profile?.energyLevel   ?? "")
  const [goodWithKids, setGoodWithKids] = useState<Ternary>(fromBool(profile?.goodWithKids))
  const [goodWithDogs, setGoodWithDogs] = useState<Ternary>(fromBool(profile?.goodWithDogs))
  const [goodWithCats, setGoodWithCats] = useState<Ternary>(fromBool(profile?.goodWithCats))
  const [idealHome,    setIdealHome]    = useState<string>(profile?.idealHome     ?? "")
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    const res = await fetch(`/api/animals/${animalId}/personality`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traits,
        energyLevel:  energyLevel || null,
        goodWithKids: toBool(goodWithKids),
        goodWithDogs: toBool(goodWithDogs),
        goodWithCats: toBool(goodWithCats),
        idealHome:    idealHome || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error ?? "Save failed")
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Traits */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Traits
        </label>
        <TagSelect options={TRAIT_OPTIONS} selected={traits} onChange={setTraits} />
      </div>

      {/* Energy level */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Energy Level
        </label>
        <div className="flex gap-3">
          {ENERGY_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="energyLevel"
                value={opt}
                checked={energyLevel === opt}
                onChange={() => setEnergyLevel(opt)}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="energyLevel"
              value=""
              checked={energyLevel === ""}
              onChange={() => setEnergyLevel("")}
              className="accent-blue-600"
            />
            <span className="text-sm text-slate-500">Unknown</span>
          </label>
        </div>
      </div>

      {/* Ternary booleans */}
      {(
        [
          ["goodWithKids", "Good with Kids", goodWithKids, setGoodWithKids],
          ["goodWithDogs", "Good with Dogs", goodWithDogs, setGoodWithDogs],
          ["goodWithCats", "Good with Cats", goodWithCats, setGoodWithCats],
        ] as [string, string, Ternary, (v: Ternary) => void][]
      ).map(([key, label, value, setter]) => (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </label>
          <div className="flex gap-4">
            {(["true", "false", "unknown"] as Ternary[]).map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={key}
                  value={opt}
                  checked={value === opt}
                  onChange={() => setter(opt)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700 capitalize">
                  {opt === "true" ? "Yes" : opt === "false" ? "No" : "Unknown"}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Ideal home */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Ideal Home
        </label>
        <textarea
          rows={3}
          value={idealHome}
          onChange={(e) => setIdealHome(e.target.value)}
          placeholder="Describe the best home environment for this animal…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error   && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Saved successfully.</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  )
}
