"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Trash2 } from "lucide-react"

interface Props {
  storyId:     string
  isPublished: boolean
}

export function StoryActions({ storyId, isPublished }: Props) {
  const router   = useRouter()
  const [busy,   setBusy]   = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function togglePublish() {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/success-stories/${storyId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isPublished: !isPublished }),
    })
    setBusy(false)
    if (!res.ok) {
      setError("Failed to update. Please try again.")
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Delete this story? This cannot be undone.")) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/success-stories/${storyId}`, { method: "DELETE" })
    setBusy(false)
    if (!res.ok) {
      setError("Failed to delete. Please try again.")
      return
    }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-xs text-red-500 mr-1">{error}</span>}
      <button
        onClick={togglePublish}
        disabled={busy}
        title={isPublished ? "Unpublish" : "Publish"}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          isPublished
            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
        }`}
      >
        {isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {isPublished ? "Published" : "Draft"}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy}
        title="Delete story"
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
