"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type RecordType = "VACCINATION" | "SURGERY" | "MEDICATION"

export function MedicalRecordForm({ animalId }: { animalId: string }) {
  const router = useRouter()
  const [type,    setType]    = useState<RecordType>("VACCINATION")
  const [date,    setDate]    = useState("")
  const [notes,   setNotes]   = useState("")
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Type-specific fields
  const [vaccineName,  setVaccineName]  = useState("")
  const [nextDueDate,  setNextDueDate]  = useState("")
  const [surgeryType,  setSurgeryType]  = useState("")
  const [outcome,      setOutcome]      = useState("")
  const [recoveryNotes,setRecoveryNotes]= useState("")
  const [drugName,     setDrugName]     = useState("")
  const [dosage,       setDosage]       = useState("")
  const [frequency,    setFrequency]    = useState("")
  const [medEndDate,   setMedEndDate]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const common = { type, date, notes: notes || null }
    let specific: Record<string, unknown> = {}
    if (type === "VACCINATION") {
      specific = { vaccineName, nextDueDate: nextDueDate || null }
    } else if (type === "SURGERY") {
      specific = { surgeryType, outcome: outcome || null, recoveryNotes: recoveryNotes || null }
    } else {
      specific = { drugName, dosage: dosage || null, frequency: frequency || null, medicationEndDate: medEndDate || null }
    }

    const res = await fetch(`/api/animals/${animalId}/medical`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...common, ...specific }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error ?? "Save failed")
      return
    }
    setSuccess(true)
    setDate(""); setNotes("")
    setVaccineName(""); setNextDueDate("")
    setSurgeryType(""); setOutcome(""); setRecoveryNotes("")
    setDrugName(""); setDosage(""); setFrequency(""); setMedEndDate("")
    router.refresh()
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "text-xs font-medium text-slate-500 uppercase tracking-wide"

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700">Add Record</h3>

      {/* Type selector */}
      <div className="flex gap-2">
        {(["VACCINATION", "SURGERY", "MEDICATION"] as RecordType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={[
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              type === t
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Common: date */}
      <div className="space-y-1">
        <label className={labelCls}>Date *</label>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </div>

      {/* Vaccination fields */}
      {type === "VACCINATION" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelCls}>Vaccine Name *</label>
            <input required value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} className={inputCls} placeholder="e.g. Rabies" />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Next Due Date</label>
            <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {/* Surgery fields */}
      {type === "SURGERY" && (
        <>
          <div className="space-y-1">
            <label className={labelCls}>Surgery Type *</label>
            <input required value={surgeryType} onChange={(e) => setSurgeryType(e.target.value)} className={inputCls} placeholder="e.g. Spay" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Outcome</label>
              <input value={outcome} onChange={(e) => setOutcome(e.target.value)} className={inputCls} placeholder="e.g. Successful" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Recovery Notes</label>
              <input value={recoveryNotes} onChange={(e) => setRecoveryNotes(e.target.value)} className={inputCls} />
            </div>
          </div>
        </>
      )}

      {/* Medication fields */}
      {type === "MEDICATION" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Drug Name *</label>
              <input required value={drugName} onChange={(e) => setDrugName(e.target.value)} className={inputCls} placeholder="e.g. Amoxicillin" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Dosage</label>
              <input value={dosage} onChange={(e) => setDosage(e.target.value)} className={inputCls} placeholder="e.g. 250mg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Frequency</label>
              <input value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls} placeholder="e.g. Twice daily" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>End Date</label>
              <input type="date" value={medEndDate} onChange={(e) => setMedEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </>
      )}

      {/* Common: notes */}
      <div className="space-y-1">
        <label className={labelCls}>Notes</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} />
      </div>

      {error   && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Record saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save record"}
      </button>
    </form>
  )
}
