"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import {
  ApplicationCreateSchema,
  type ApplicationCreateInput,
} from "@/lib/validators/application"

interface Props {
  animalId: string
}

interface DuplicateInfo {
  animalName: string
  email: string
}

export function ApplicationForm({ animalId }: Props) {
  const router = useRouter()
  const [serverError, setServerError]   = useState<string | null>(null)
  const [duplicate, setDuplicate]       = useState<DuplicateInfo | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationCreateInput>({
    resolver: zodResolver(ApplicationCreateSchema),
    defaultValues: { animalId },
  })

  async function onSubmit(data: ApplicationCreateInput) {
    setServerError(null)
    setDuplicate(null)

    const res = await fetch("/api/applications", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })

    if (res.ok) {
      router.push(
        `/apply/${animalId}/success?email=${encodeURIComponent(data.applicantEmail)}`,
      )
      return
    }

    const json = await res.json().catch(() => ({}))

    // Story 25 — structured duplicate response
    if (res.status === 409 && json.code === "DUPLICATE_APPLICATION") {
      setDuplicate({ animalName: json.animalName, email: json.email })
      return
    }

    setServerError(json.error ?? "Something went wrong. Please try again.")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Hidden animalId */}
      <input type="hidden" {...register("animalId")} />

      <Input
        label="Full Name"
        placeholder="Jane Smith"
        required
        error={errors.applicantName?.message}
        {...register("applicantName")}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="jane@example.com"
        required
        error={errors.applicantEmail?.message}
        {...register("applicantEmail")}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+1 (555) 000-0000"
        hint="Optional"
        error={errors.applicantPhone?.message}
        {...register("applicantPhone")}
      />

      <Input
        label="Home Address"
        placeholder="123 Main St, Springfield, IL 62701"
        hint="Optional"
        error={errors.applicantAddress?.message}
        {...register("applicantAddress")}
      />

      <Textarea
        label="Household Notes"
        placeholder="Tell us about your household — how many people, other pets, housing type (house / apartment), yard, etc."
        hint="Optional — but helps us find the best match"
        rows={5}
        error={errors.householdNotes?.message}
        {...register("householdNotes")}
      />

      {/* Story 25 — friendly duplicate notice */}
      {duplicate && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800">
            You&apos;ve already applied for <strong>{duplicate.animalName}</strong>.
            We&apos;ll be in touch at <strong>{duplicate.email}</strong>.
          </p>
        </div>
      )}

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        className="w-full"
      >
        Submit Application
      </Button>
    </form>
  )
}
