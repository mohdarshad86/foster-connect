"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X, ShieldCheck } from "lucide-react"

const DEFAULT_HEALTH = "Up to date with routine vet care"
const MAX_CHARS = 200

interface Props {
  animalId:      string
  healthSummary: string | null
}

/**
 * Story 46 — Inline editor for the public health summary.
 * Shown to Medical Officer and Rescue Lead on the staff animal profile page.
 */
export function HealthSummaryEdit({ animalId, healthSummary }: Props) {
  const router = useRouter()
  const [open,   setOpen]   = useState(false)
  const [text,   setText]   = useState(healthSummary ?? "")
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    if (text.length > MAX_CHARS) { setError(`Health summary cannot exceed ${MAX_CHARS} characters.`); return }
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/animals/${animalId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ healthSummary: text.trim() || null }),
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Health Summary <span className="text-slate-400 normal-case">(public)</span>
          </span>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {!open ? (
        <p className="text-sm text-slate-700 italic">
          {healthSummary ?? <span className="text-slate-400">{DEFAULT_HEALTH} (default)</span>}
        </p>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Shown on the public profile page</span>
            <button onClick={() => { setOpen(false); setError(null) }}>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          </div>

          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={DEFAULT_HEALTH}
            maxLength={MAX_CHARS}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />

          <div className="flex items-center justify-between">
            <span className={`text-xs ${text.length > MAX_CHARS ? "text-red-500" : "text-slate-400"}`}>
              {text.length}/{MAX_CHARS}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setError(null) }}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
