"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

interface Props {
  userId:   string
  isActive: boolean
  isSelf:   boolean
}

export function ToggleActiveButton({ userId, isActive, isSelf }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: !isActive }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? "Failed to update account status.")
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={isActive ? "secondary" : "primary"}
        loading={loading}
        disabled={isSelf}
        title={isSelf ? "You cannot deactivate your own account" : undefined}
        onClick={handleToggle}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
