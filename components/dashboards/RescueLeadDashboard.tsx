import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardRow, CardEmpty } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  PawPrint,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react"

export async function RescueLeadDashboard() {
  // Fetch all data in parallel
  const [intake, inFoster, adoptionReady, pendingAdoption, adopted, criticalAlerts, pendingDecisions] =
    await Promise.all([
      prisma.animal.count({ where: { status: "INTAKE" } }),
      prisma.animal.count({ where: { status: "IN_FOSTER" } }),
      prisma.animal.count({ where: { status: "ADOPTION_READY" } }),
      prisma.animal.count({ where: { status: "PENDING_ADOPTION" } }),
      prisma.animal.count({ where: { status: "ADOPTED" } }),
      prisma.medicalAlert.findMany({
        where: { severity: "CRITICAL", isResolved: false },
        include: { animal: { select: { id: true, name: true } }, createdBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.adopterApplication.findMany({
        where: { status: "RECOMMENDED" },
        include: {
          animal: { select: { id: true, name: true } },
          counselor: { select: { name: true } },
        },
        orderBy: { updatedAt: "asc" },
      }),
    ])

  const total = intake + inFoster + adoptionReady + pendingAdoption + adopted

  // Capacity bar segments (percentages)
  const segments = [
    { label: "Intake",          count: intake,          color: "bg-slate-400" },
    { label: "In Foster",       count: inFoster,         color: "bg-blue-500" },
    { label: "Adoption Ready",  count: adoptionReady,    color: "bg-green-500" },
    { label: "Pending Adoption",count: pendingAdoption,  color: "bg-yellow-500" },
    { label: "Adopted",         count: adopted,          color: "bg-purple-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organisation Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          {total} animal{total !== 1 ? "s" : ""} across all stages
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="In Intake"        value={intake}         color="gray"   icon={<PawPrint className="w-5 h-5" />} />
        <StatCard label="In Foster"        value={inFoster}       color="blue"   icon={<PawPrint className="w-5 h-5" />} />
        <StatCard label="Adoption Ready"   value={adoptionReady}  color="green"  icon={<PawPrint className="w-5 h-5" />} />
        <StatCard label="Pending Adoption" value={pendingAdoption} color="yellow" icon={<PawPrint className="w-5 h-5" />} />
      </div>

      {/* Capacity bar */}
      {total > 0 && (
        <Card title="Capacity Breakdown">
          <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
            {segments
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.label}
                  className={s.color}
                  style={{ width: `${(s.count / total) * 100}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {segments.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.color}`} />
                {s.label} ({s.count})
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Unresolved Critical Alerts */}
        <Card
          title="Unresolved Critical Alerts"
          action={
            criticalAlerts.length > 0 ? (
              <Badge variant="red">{criticalAlerts.length}</Badge>
            ) : null
          }
        >
          {criticalAlerts.length === 0 ? (
            <CardEmpty message="No critical alerts — all clear." />
          ) : (
            criticalAlerts.map((alert) => (
              <CardRow key={alert.id}>
                <div className="min-w-0">
                  <Link
                    href={`/animals/${alert.animal.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                  >
                    {alert.animal.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{alert.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <ShieldAlert className="w-4 h-4 text-red-500 mb-0.5 ml-auto" />
                  <p className="text-xs text-slate-400">{formatDate(alert.createdAt)}</p>
                </div>
              </CardRow>
            ))
          )}
        </Card>

        {/* Pending Adoption Decisions */}
        <Card
          title="Awaiting Final Decision"
          action={
            pendingDecisions.length > 0 ? (
              <Badge variant="yellow">{pendingDecisions.length}</Badge>
            ) : null
          }
        >
          {pendingDecisions.length === 0 ? (
            <CardEmpty message="No recommendations pending." />
          ) : (
            pendingDecisions.map((app) => (
              <CardRow key={app.id}>
                <div className="min-w-0">
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                  >
                    {app.applicantName}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {app.animal.name}
                    {app.counselor ? ` · via ${app.counselor.name}` : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  <ClipboardCheck className="w-4 h-4 text-yellow-500 ml-auto" />
                </div>
              </CardRow>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
