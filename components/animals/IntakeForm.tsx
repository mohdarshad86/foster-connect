"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, PawPrint } from "lucide-react"
import { AnimalCreateSchema, type AnimalCreateInput } from "@/lib/validators/animal"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"

export function IntakeForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [pendingData, setPendingData] = useState<AnimalCreateInput | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnimalCreateInput>({
    resolver: zodResolver(AnimalCreateSchema),
    defaultValues: { species: undefined, sex: undefined },
  })

  async function submitToApi(data: AnimalCreateInput, forceSave = false) {
    setServerError(null)

    const res = await fetch("/api/animals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, forceSave }),
    })

    if (res.status === 409) {
      const json = await res.json()
      if (json.code === "DUPLICATE_WARNING") {
        setDuplicateWarning(json.warning)
        setPendingData(data)
        return
      }
    }

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setServerError(json.error ?? "Something went wrong. Please try again.")
      return
    }

    const animal = await res.json()
    router.push(`/animals/${animal.id}`)
  }

  async function onSubmit(data: AnimalCreateInput) {
    setDuplicateWarning(null)
    setPendingData(null)
    await submitToApi(data, false)
  }

  async function onForceSave() {
    if (!pendingData) return
    setDuplicateWarning(null)
    await submitToApi(pendingData, true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div
          role="alert"
          className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-4 space-y-3"
        >
          <div className="flex items-start gap-2 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-500" />
            <p>{duplicateWarning}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={onForceSave}
            >
              Save anyway
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setDuplicateWarning(null); setPendingData(null) }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Required fields ── */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Animal name"
          placeholder="e.g. Biscuit"
          error={errors.name?.message}
          required
          {...register("name")}
        />

        <Select
          label="Species"
          error={errors.species?.message}
          required
          defaultValue=""
          {...register("species")}
        >
          <option value="" disabled>Select species…</option>
          <option value="Dog">Dog</option>
          <option value="Cat">Cat</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Sex"
          error={errors.sex?.message}
          required
          defaultValue=""
          {...register("sex")}
        >
          <option value="" disabled>Select sex…</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Unknown">Unknown</option>
        </Select>

        <Input
          label="Breed"
          placeholder="e.g. Labrador mix"
          hint="Leave blank if unknown"
          error={errors.breed?.message}
          {...register("breed")}
        />
      </div>

      {/* ── Optional fields ── */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Age (years)"
          type="number"
          min={0}
          max={30}
          step={0.5}
          placeholder="e.g. 2.5"
          hint="Approximate is fine"
          error={errors.ageYears?.message}
          {...register("ageYears")}
        />

        <Input
          label="Color & markings"
          placeholder="e.g. Golden with white chest"
          error={errors.colorMarkings?.message}
          {...register("colorMarkings")}
        />
      </div>

      <Textarea
        label="Initial health notes"
        placeholder="Describe any visible injuries, conditions, or observations at intake…"
        hint="Optional — captured for your reference"
        rows={4}
        error={errors.intakeNotes?.message}
        {...register("intakeNotes")}
      />

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!!duplicateWarning}
        >
          <PawPrint className="w-4 h-4" />
          Add Animal
        </Button>
      </div>
    </form>
  )
}
