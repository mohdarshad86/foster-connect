"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { UserPlus, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { UserCreateSchema, type UserCreateInput } from "@/lib/validators/user"

const ROLE_OPTIONS = [
  { value: "RESCUE_LEAD",        label: "Rescue Lead"        },
  { value: "INTAKE_SPECIALIST",  label: "Intake Specialist"  },
  { value: "FOSTER_PARENT",      label: "Foster Parent"      },
  { value: "MEDICAL_OFFICER",    label: "Medical Officer"    },
  { value: "ADOPTION_COUNSELOR", label: "Adoption Counselor" },
]

interface CreatedUser {
  name:         string
  email:        string
  tempPassword: string
}

export function CreateUserForm() {
  const router  = useRouter()
  const [open,        setOpen]        = useState(false)
  const [created,     setCreated]     = useState<CreatedUser | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [copied,      setCopied]      = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(UserCreateSchema),
  })

  async function onSubmit(data: UserCreateInput) {
    setServerError(null)

    const res = await fetch("/api/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setServerError(json.error ?? "Failed to create user.")
      return
    }

    setCreated({
      name:         json.name,
      email:        json.email,
      tempPassword: json.tempPassword,
    })
    reset()
    router.refresh() // refresh the user list below
  }

  async function copyPassword() {
    if (!created) return
    await navigator.clipboard.writeText(created.tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCreateAnother() {
    setCreated(null)
    setServerError(null)
  }

  function handleClose() {
    setCreated(null)
    setServerError(null)
    reset()
    setOpen(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">Create New User</span>
        </div>
        {open
          ? <ChevronUp   className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>

      {open && (
        <div className="border-t border-slate-100 px-6 py-5">
          {/* Success state — show temp password */}
          {created ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-green-800">
                  Account created for {created.name}
                </p>
                <p className="text-xs text-green-700">
                  Share the temporary password below with {created.email}.
                  It will not be shown again.
                </p>
              </div>

              {/* Temp password display */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Temporary Password
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-100 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-900 select-all">
                    {created.tempPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={copyPassword}
                    className="shrink-0"
                  >
                    {copied
                      ? <Check className="w-3.5 h-3.5 text-green-600" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleCreateAnother}>
                  Create another
                </Button>
                <Button size="sm" variant="secondary" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Jane Smith"
                  required
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="jane@rescue.org"
                  required
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  Role <span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue=""
                  {...register("role")}
                >
                  <option value="" disabled>Select a role…</option>
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-xs text-red-600">{errors.role.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" loading={isSubmitting}>
                  Create User
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
