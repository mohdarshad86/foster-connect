"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface FosterOption {
  id: string
  name: string
}

interface Props {
  animalId: string
  currentFosterParentId: string | null
  fosterParents: FosterOption[]
}

export function AssignFosterForm({ animalId, currentFosterParentId, fosterParents }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentFosterParentId ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = selected !== (currentFosterParentId ?? "")

  async function handleSave() {
    if (!selected || !isDirty) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fosterParentId: selected }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? "Failed to assign foster parent.")
        return
      }

      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (fosterParents.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No active foster parents are registered in the system.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">— Unassigned —</option>
        {fosterParents.map((fp) => (
          <option key={fp.id} value={fp.id}>
            {fp.name}
          </option>
        ))}
      </select>

      <Button
        size="sm"
        loading={saving}
        disabled={!isDirty || !selected}
        onClick={handleSave}
      >
        <UserCheck className="w-4 h-4" />
        Assign
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
