"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge"
import { formatDateTimeShort } from "@/lib/utils"
import type { ApplicationStatus } from "@prisma/client"

const HOME_CHECK_OPTIONS = [
  { value: "",       label: "— Not set —" },
  { value: "Pending", label: "Pending"   },
  { value: "Passed",  label: "Passed"    },
  { value: "Failed",  label: "Failed"    },
]

interface Props {
  application: {
    id:              string
    status:          ApplicationStatus
    screeningNotes:  string | null
    homeCheckStatus: string | null
    updatedAt:       string
    counselorId:     string | null
    counselor:       { id: string; name: string } | null
  }
}

export function ApplicationDetailForm({ application }: Props) {
  const router = useRouter()

  const [screeningNotes,  setScreeningNotes]  = useState(application.screeningNotes  ?? "")
  const [homeCheckStatus, setHomeCheckStatus] = useState(application.homeCheckStatus ?? "")
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const isDirty =
    screeningNotes  !== (application.screeningNotes  ?? "") ||
    homeCheckStatus !== (application.homeCheckStatus ?? "")

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSavedAt(null)

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          screeningNotes:  screeningNotes  || null,
          homeCheckStatus: homeCheckStatus || null,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? "Failed to save changes.")
        return
      }

      setSavedAt(new Date().toISOString())
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status + last updated */}
      <div className="flex items-center justify-between">
        <ApplicationStatusBadge status={application.status} />
        <div className="text-right text-xs text-slate-400">
          {application.counselor ? (
            <>
              Last updated {formatDateTimeShort(application.updatedAt)}
              {" · "}
              <span className="text-slate-600 font-medium">{application.counselor.name}</span>
            </>
          ) : (
            <span className="italic">Unclaimed — will be claimed on first save</span>
          )}
        </div>
      </div>

      {/* Screening notes */}
      <Textarea
        label="Screening Notes"
        placeholder="Add notes about your screening conversation, red flags, positive observations…"
        rows={5}
        value={screeningNotes}
        onChange={(e) => setScreeningNotes(e.target.value)}
        hint="Visible to Adoption Counselors and Rescue Lead only"
      />

      {/* Home check status */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Home Check Status</label>
        <select
          value={homeCheckStatus}
          onChange={(e) => setHomeCheckStatus(e.target.value)}
          className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {HOME_CHECK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {homeCheckStatus === "Failed" && (
          <p className="text-xs text-red-600 mt-0.5">
            Saving with a Failed home check will move this application to Denied.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          loading={saving}
          disabled={!isDirty}
          onClick={handleSave}
        >
          Save Changes
        </Button>

        {savedAt && (
          <p className="text-xs text-green-600">
            Saved at {formatDateTimeShort(savedAt)}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
