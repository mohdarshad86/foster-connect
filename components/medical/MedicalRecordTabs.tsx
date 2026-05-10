"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Ban } from "lucide-react"
import type { MedicalRecord } from "@prisma/client"

type Tab = "VACCINATION" | "SURGERY" | "MEDICATION"

interface RecordWithCreator extends MedicalRecord {
  createdBy: { name: string }
}

interface Props {
  records:  RecordWithCreator[]
  animalId: string
  canVoid:  boolean
}

// ---------------------------------------------------------------------------
// VoidButton — isolated client action per record
// ---------------------------------------------------------------------------
function VoidButton({ animalId, recordId }: { animalId: string; recordId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleVoid() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/animals/${animalId}/medical/${recordId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isVoided: true }),
    })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? "Failed to void record.")
      return
    }
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs text-slate-600">Void this record? Cannot be undone.</span>
        <button
          onClick={handleVoid}
          disabled={loading}
          className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
        >
          {loading ? "Voiding…" : "Yes, void"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-slate-500 hover:underline"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
      title="Void this record"
    >
      <Ban className="w-3.5 h-3.5" />
      Void
    </button>
  )
}

// ---------------------------------------------------------------------------
// MedicalRecordTabs
// ---------------------------------------------------------------------------
export function MedicalRecordTabs({ records, animalId, canVoid }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("VACCINATION")

  const filtered = records.filter((r) => r.type === activeTab)

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["VACCINATION", "SURGERY", "MEDICATION"] as Tab[]).map((tab) => {
          const count = records.filter((r) => r.type === tab && !r.isVoided).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-3 py-2 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}s
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Records list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No records.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className={[
                "border rounded-xl p-4 text-sm space-y-1.5",
                r.isVoided
                  ? "border-slate-100 bg-slate-50 opacity-60"
                  : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${r.isVoided ? "text-slate-400 line-through" : "text-slate-800"}`}>
                    {r.type === "VACCINATION" && r.vaccineName}
                    {r.type === "SURGERY"     && r.surgeryType}
                    {r.type === "MEDICATION"  && r.drugName}
                  </span>
                  {r.isVoided && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 text-xs font-medium">
                      <Ban className="w-3 h-3" /> Voided
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{formatDate(r.date)}</span>
              </div>

              {!r.isVoided && (
                <>
                  {r.type === "VACCINATION" && r.nextDueDate && (
                    <p className="text-xs text-slate-500">Next due: {formatDate(r.nextDueDate)}</p>
                  )}
                  {r.type === "SURGERY" && (
                    <>
                      {r.outcome       && <p className="text-xs text-slate-500">Outcome: {r.outcome}</p>}
                      {r.recoveryNotes && <p className="text-xs text-slate-500">Recovery: {r.recoveryNotes}</p>}
                    </>
                  )}
                  {r.type === "MEDICATION" && (
                    <div className="flex gap-4 text-xs text-slate-500">
                      {r.dosage    && <span>{r.dosage}</span>}
                      {r.frequency && <span>{r.frequency}</span>}
                      {r.medicationEndDate && <span>Until {formatDate(r.medicationEndDate)}</span>}
                    </div>
                  )}
                  {r.notes && <p className="text-xs text-slate-500 italic">{r.notes}</p>}
                </>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Added by {r.createdBy.name}</p>
                {canVoid && !r.isVoided && (
                  <VoidButton animalId={animalId} recordId={r.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
