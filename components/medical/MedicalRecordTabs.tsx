"use client"

import { useState } from "react"
import { formatDate } from "@/lib/utils"
import type { MedicalRecord } from "@prisma/client"

type Tab = "VACCINATION" | "SURGERY" | "MEDICATION"

interface RecordWithCreator extends MedicalRecord {
  createdBy: { name: string }
}

interface Props {
  records: RecordWithCreator[]
}

export function MedicalRecordTabs({ records }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("VACCINATION")

  const filtered = records.filter((r) => r.type === activeTab)

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["VACCINATION", "SURGERY", "MEDICATION"] as Tab[]).map((tab) => {
          const count = records.filter((r) => r.type === tab).length
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
            <li key={r.id} className="border border-slate-200 rounded-xl p-4 text-sm space-y-1.5">
              <div className="flex items-start justify-between">
                <span className="font-medium text-slate-800">
                  {r.type === "VACCINATION" && r.vaccineName}
                  {r.type === "SURGERY"     && r.surgeryType}
                  {r.type === "MEDICATION"  && r.drugName}
                </span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{formatDate(r.date)}</span>
              </div>

              {r.type === "VACCINATION" && r.nextDueDate && (
                <p className="text-xs text-slate-500">Next due: {formatDate(r.nextDueDate)}</p>
              )}
              {r.type === "SURGERY" && (
                <>
                  {r.outcome      && <p className="text-xs text-slate-500">Outcome: {r.outcome}</p>}
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
              <p className="text-xs text-slate-400">Added by {r.createdBy.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
