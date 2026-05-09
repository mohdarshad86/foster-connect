"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

interface Props {
  animalId: string
}

export function FlagConcernForm({ animalId }: Props) {
  const router = useRouter()
  const [open,        setOpen]        = useState(false)
  const [description, setDescription] = useState("")
  const [urgency,     setUrgency]     = useState<"Urgent" | "Non-urgent">("Non-urgent")
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 20) {
      setError("Please describe the concern in at least 20 characters.")
      return
    }

    setSaving(true)
    setError(null)

    const res = await fetch(`/api/animals/${animalId}/alerts`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        // Urgency maps to alert severity on the client before sending
        severity: urgency === "Urgent" ? "CRITICAL" : "INFORMATIONAL",
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? "Failed to submit concern. Please try again.")
      return
    }

    setDescription("")
    setUrgency("Non-urgent")
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        Flag a Concern
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-amber-200 rounded-xl bg-amber-50 p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Flag a Concern
      </h3>

      <div className="space-y-1">
        <label className="text-xs font-medium text-amber-700 uppercase tracking-wide">
          Describe the concern <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          minLength={20}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you've noticed (min 20 characters)…"
          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
        <p className="text-xs text-amber-600">{description.trim().length} / 20 characters minimum</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-amber-700 uppercase tracking-wide">Urgency</label>
        <div className="flex gap-4">
          {(["Non-urgent", "Urgent"] as const).map((level) => (
            <label key={level} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value={level}
                checked={urgency === level}
                onChange={() => setUrgency(level)}
                className="accent-amber-600"
              />
              <span className={`text-sm font-medium ${level === "Urgent" ? "text-red-700" : "text-amber-700"}`}>
                {level}
              </span>
            </label>
          ))}
        </div>
        {urgency === "Urgent" && (
          <p className="text-xs text-red-600 font-medium">
            Urgent concerns create a Critical alert and notify staff immediately.
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Submitting…" : "Submit Concern"}
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
  )
}
