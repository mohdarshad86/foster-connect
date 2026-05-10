"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { AlertTriangle } from "lucide-react"

interface Props {
  userId:   string
  isActive: boolean
  isSelf:   boolean
}

interface ActiveAssignmentWarning {
  animalNames: string[]
}

export function ToggleActiveButton({ userId, isActive, isSelf }: Props) {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [warning, setWarning]   = useState<ActiveAssignmentWarning | null>(null)

  async function sendToggle(force = false) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: !isActive, ...(force ? { force: true } : {}) }),
      })

      if (res.status === 409) {
        const json = await res.json().catch(() => ({}))
        if (json.code === "ACTIVE_ASSIGNMENTS") {
          setWarning({ animalNames: json.animalNames ?? [] })
          return
        }
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? "Failed to update account status.")
        return
      }

      setWarning(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmation state (active assignment warning)
  if (warning) {
    const names = warning.animalNames.join(", ")
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 max-w-xs text-right">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 text-left">
            This foster parent is currently assigned to <strong>{names}</strong>.
            Deactivating them will remove these assignments. Continue?
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setWarning(null)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            loading={loading}
            onClick={() => sendToggle(true)}
          >
            Deactivate Anyway
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={isActive ? "secondary" : "primary"}
        loading={loading}
        disabled={isSelf}
        title={isSelf ? "You cannot deactivate your own account" : undefined}
        onClick={() => sendToggle(false)}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
