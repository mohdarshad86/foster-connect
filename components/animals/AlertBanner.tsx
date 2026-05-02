import { AlertTriangle, Info } from "lucide-react"
import type { AlertSeverity } from "@prisma/client"
import { ResolveAlertButton } from "./ResolveAlertButton"

interface Alert {
  id:          string
  description: string
  severity:    AlertSeverity
}

interface Props {
  alerts:     Alert[]
  canResolve?: boolean
  animalId?:  string
}

export function AlertBanner({ alerts, canResolve = false, animalId }: Props) {
  if (alerts.length === 0) return null

  const critical      = alerts.filter((a) => a.severity === "CRITICAL")
  const informational = alerts.filter((a) => a.severity === "INFORMATIONAL")

  return (
    <div className="space-y-2">
      {critical.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              Critical Alert{critical.length > 1 ? "s" : ""}
            </p>
          </div>
          {critical.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 pl-6">
              <p className="text-sm text-red-600">{a.description}</p>
              {canResolve && animalId && (
                <ResolveAlertButton alertId={a.id} animalId={animalId} />
              )}
            </div>
          ))}
        </div>
      )}

      {informational.length > 0 && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-sm font-semibold text-yellow-700">
              Notice{informational.length > 1 ? "s" : ""}
            </p>
          </div>
          {informational.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 pl-6">
              <p className="text-sm text-yellow-700">{a.description}</p>
              {canResolve && animalId && (
                <ResolveAlertButton alertId={a.id} animalId={animalId} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
