"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface TabConfig {
  id:      string
  label:   string
  content: ReactNode
}

interface Props {
  tabs:          TabConfig[]
  defaultTabId?: string
}

export function AnimalProfileTabs({ tabs, defaultTabId }: Props) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id ?? "")

  if (tabs.length === 0) return null

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-slate-200 flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={cn(
              "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0",
              activeId === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="p-6">
        {active.content}
      </div>
    </div>
  )
}
