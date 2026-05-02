"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function PlaceAlertForm({ animalId }: { animalId: string }) {
  const router = useRouter()
  const [open,        setOpen]        = useState(false)
  const [description, setDescription] = useState("")
  const [severity,    setSeverity]    = useState<"CRITICAL" | "INFORMATIONAL">("INFORMATIONAL")
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/animals/${animalId}/alerts`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ description, severity }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error ?? "Failed to place alert")
      return
    }
    setDescription("")
    setSeverity("INFORMATIONAL")
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
      >
        + Place Alert
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-red-200 rounded-xl bg-red-50 p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-red-800">Place Medical Alert</h3>

      <div className="space-y-1">
        <label className="text-xs font-medium text-red-700 uppercase tracking-wide">
          Description *
        </label>
        <textarea
          rows={2}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the concern…"
          className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
      </div>

      <div className="flex gap-4">
        {(["INFORMATIONAL", "CRITICAL"] as const).map((sev) => (
          <label key={sev} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="severity"
              value={sev}
              checked={severity === sev}
              onChange={() => setSeverity(sev)}
              className="accent-red-600"
            />
            <span className={`text-sm font-medium ${sev === "CRITICAL" ? "text-red-700" : "text-yellow-700"}`}>
              {sev === "CRITICAL" ? "Critical" : "Informational"}
            </span>
          </label>
        ))}
      </div>

      {severity === "CRITICAL" && (
        <p className="text-xs text-red-600 font-medium">
          Critical alerts block adoption approval until resolved.
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? "Placing…" : "Place Alert"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
