"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { AnimalStatus } from "@prisma/client"

const TRANSITION_LABELS: Record<AnimalStatus, string> = {
  INTAKE:           "Return to Intake",
  IN_FOSTER:        "Move to Foster",
  ADOPTION_READY:   "Mark Adoption Ready",
  PENDING_ADOPTION: "Mark Pending Adoption",
  ADOPTED:          "Finalise Adoption",
}

interface Props {
  animalId: string
  validNextStatuses: AnimalStatus[]
}

export function StatusTransitionPanel({ animalId, validNextStatuses }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<AnimalStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (validNextStatuses.length === 0) return null

  async function handleTransition(toStatus: AnimalStatus) {
    setLoading(toStatus)
    setError(null)

    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? "Status update failed.")
        return
      }

      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {validNextStatuses.map((toStatus) => {
          const isReturn = toStatus === "INTAKE"
          return (
            <Button
              key={toStatus}
              size="sm"
              variant={isReturn ? "secondary" : "primary"}
              loading={loading === toStatus}
              disabled={loading !== null}
              onClick={() => handleTransition(toStatus)}
            >
              {isReturn
                ? <RotateCcw className="w-3.5 h-3.5" />
                : <ArrowRight className="w-3.5 h-3.5" />
              }
              {TRANSITION_LABELS[toStatus]}
            </Button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
