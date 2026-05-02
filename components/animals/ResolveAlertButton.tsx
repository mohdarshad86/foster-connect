"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  alertId:  string
  animalId: string
}

export function ResolveAlertButton({ alertId, animalId }: Props) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    await fetch(`/api/animals/${animalId}/alerts/${alertId}`, { method: "PATCH" })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      className="shrink-0 text-xs font-medium px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "Resolve"}
    </button>
  )
}
