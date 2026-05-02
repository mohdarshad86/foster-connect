"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { getWeekMonday } from "@/lib/utils"

const schema = z.object({
  weekOf:   z.string().min(1, "Required"),
  noteText: z.string().min(20, "Note must be at least 20 characters"),
  weightKg: z.string().optional(),
})
type Fields = z.infer<typeof schema>

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function ProgressNoteForm({ animalId }: { animalId: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [pendingData, setPendingData] = useState<Fields | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { weekOf: toISODate(getWeekMonday()) },
  })

  async function submit(data: Fields, force = false) {
    setServerError(null)
    const body = {
      weekOf:   data.weekOf,
      noteText: data.noteText,
      weightKg: data.weightKg ? parseFloat(data.weightKg) : null,
      force,
    }
    const res = await fetch(`/api/animals/${animalId}/notes`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    if (res.status === 409) {
      setPendingData(data)
      setDuplicateWarning(true)
      return
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setServerError(err.error ?? "Something went wrong")
      return
    }
    reset({ weekOf: toISODate(getWeekMonday()), noteText: "", weightKg: "" })
    setDuplicateWarning(false)
    setPendingData(null)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit((data) => submit(data, false))}
      className="space-y-4 border border-slate-200 rounded-xl p-4"
    >
      <h3 className="text-sm font-semibold text-slate-700">Add Progress Note</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Week of
          </label>
          <input
            type="date"
            {...register("weekOf")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.weekOf && (
            <p className="text-xs text-red-500">{errors.weekOf.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="Optional"
            {...register("weightKg")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Note
        </label>
        <textarea
          rows={4}
          placeholder="Describe the animal's behavior, adjustment, activity level…"
          {...register("noteText")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.noteText && (
          <p className="text-xs text-red-500">{errors.noteText.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-xs text-red-500">{serverError}</p>
      )}

      {duplicateWarning && pendingData && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 space-y-2">
          <p className="text-sm text-yellow-800 font-medium">
            A note for this week already exists. Replace it?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => submit(pendingData, true)}
              className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
            >
              Yes, replace
            </button>
            <button
              type="button"
              onClick={() => { setDuplicateWarning(false); setPendingData(null) }}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!duplicateWarning && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save note"}
        </button>
      )}
    </form>
  )
}
