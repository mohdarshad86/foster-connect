"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PawPrint, ShieldCheck } from "lucide-react"

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormInput = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormInput) {
    setServerError(null)

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: data.newPassword }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setServerError(body.error ?? "Something went wrong. Please try again.")
      return
    }

    setSuccess(true)
    // Sign out so the new JWT (without mustChangePassword) is issued on next login
    setTimeout(() => signOut({ callbackUrl: "/login" }), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">Foster Connect</h1>
            <p className="text-xs text-slate-500 mt-0.5">Animal Rescue Platform</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mb-1">Set your password</h2>
        <p className="text-sm text-slate-500 mb-6">
          Your account was created with a temporary password. Please set a new one before continuing.
        </p>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <ShieldCheck className="w-12 h-12 text-green-500" />
            <p className="text-slate-700 font-medium">Password updated!</p>
            <p className="text-sm text-slate-500 text-center">
              Signing you out now. Please log in with your new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              hint="At least 8 characters, one uppercase letter, one number"
              {...register("newPassword")}
            />

            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Set password
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
