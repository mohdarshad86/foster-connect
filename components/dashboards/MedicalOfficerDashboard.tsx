import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardRow, CardEmpty } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { ShieldAlert, Syringe, Pill } from "lucide-react"

export async function MedicalOfficerDashboard() {
  const now = new Date()
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [unresolvedAlerts, upcomingVaccinations, expiringMedications] = await Promise.all([
    prisma.medicalAlert.findMany({
      where: { isResolved: false },
      include: {
        animal: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.medicalRecord.findMany({
      where: {
        type: "VACCINATION",
        nextDueDate: { gte: now, lte: fourteenDaysFromNow },
        isVoided: false,
      },
      include: { animal: { select: { id: true, name: true } } },
      orderBy: { nextDueDate: "asc" },
    }),
    prisma.medicalRecord.findMany({
      where: {
        type: "MEDICATION",
        medicationEndDate: { gte: now, lte: sevenDaysFromNow },
        isVoided: false,
      },
      include: { animal: { select: { id: true, name: true } } },
      orderBy: { medicationEndDate: "asc" },
    }),
  ])

  // Sort alerts: CRITICAL first, then INFORMATIONAL
  const sortedAlerts = [...unresolvedAlerts].sort((a, b) =>
    a.severity === "CRITICAL" && b.severity !== "CRITICAL" ? -1
    : b.severity === "CRITICAL" && a.severity !== "CRITICAL" ? 1
    : 0
  )

  const criticalCount = unresolvedAlerts.filter((a) => a.severity === "CRITICAL").length
  const infoCount = unresolvedAlerts.filter((a) => a.severity === "INFORMATIONAL").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Alerts, upcoming vaccinations, and expiring medication schedules.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Critical Alerts"
          value={criticalCount}
          color={criticalCount > 0 ? "red" : "green"}
          icon={<ShieldAlert className="w-5 h-5" />}
        />
        <StatCard
          label="Info Alerts"
          value={infoCount}
          color={infoCount > 0 ? "yellow" : "green"}
          icon={<ShieldAlert className="w-5 h-5" />}
        />
        <StatCard
          label="Vaccines Due (14 days)"
          value={upcomingVaccinations.length}
          color={upcomingVaccinations.length > 0 ? "blue" : "green"}
          icon={<Syringe className="w-5 h-5" />}
        />
        <StatCard
          label="Meds Expiring (7 days)"
          value={expiringMedications.length}
          color={expiringMedications.length > 0 ? "yellow" : "green"}
          icon={<Pill className="w-5 h-5" />}
        />
      </div>

      {/* Active Medical Alerts */}
      <Card
        title="Active Medical Alerts"
        action={
          unresolvedAlerts.length > 0 ? (
            <Badge variant={criticalCount > 0 ? "red" : "yellow"}>
              {unresolvedAlerts.length}
            </Badge>
          ) : null
        }
      >
        {sortedAlerts.length === 0 ? (
          <CardEmpty message="No active alerts — all clear." />
        ) : (
          sortedAlerts.map((alert) => (
            <CardRow key={alert.id}>
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant={alert.severity === "CRITICAL" ? "red" : "yellow"}>
                  {alert.severity === "CRITICAL" ? "Critical" : "Info"}
                </Badge>
                <div className="min-w-0">
                  <Link
                    href={`/animals/${alert.animal.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 block truncate"
                  >
                    {alert.animal.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{alert.description}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">{formatDate(alert.createdAt)}</p>
                <p className="text-xs text-slate-400">by {alert.createdBy.name}</p>
              </div>
            </CardRow>
          ))
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Vaccinations */}
        <Card title="Vaccinations Due (Next 14 Days)">
          {upcomingVaccinations.length === 0 ? (
            <CardEmpty message="No vaccinations due soon." />
          ) : (
            upcomingVaccinations.map((record) => (
              <CardRow key={record.id}>
                <div className="min-w-0">
                  <Link
                    href={`/animals/${record.animal.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 block truncate"
                  >
                    {record.animal.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{record.vaccineName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-blue-600">
                    {record.nextDueDate ? formatDate(record.nextDueDate) : "—"}
                  </p>
                </div>
              </CardRow>
            ))
          )}
        </Card>

        {/* Expiring Medications */}
        <Card title="Medications Ending (Next 7 Days)">
          {expiringMedications.length === 0 ? (
            <CardEmpty message="No medication schedules expiring soon." />
          ) : (
            expiringMedications.map((record) => (
              <CardRow key={record.id}>
                <div className="min-w-0">
                  <Link
                    href={`/animals/${record.animal.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 block truncate"
                  >
                    {record.animal.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">
                    {record.drugName} · {record.dosage}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-yellow-600">
                    {record.medicationEndDate ? formatDate(record.medicationEndDate) : "—"}
                  </p>
                </div>
              </CardRow>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
