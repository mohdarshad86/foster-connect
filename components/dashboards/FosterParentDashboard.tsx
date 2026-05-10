import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardRow, CardEmpty } from "@/components/ui/Card"
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge"
import { getWeekMonday } from "@/lib/utils"
import { PawPrint, AlertTriangle, CheckCircle } from "lucide-react"

interface Props {
  userId: string
}

export async function FosterParentDashboard({ userId }: Props) {
  const weekStart = getWeekMonday()

  const assignedAnimals = await prisma.animal.findMany({
    where: { fosterParentId: userId },
    include: {
      progressNotes: {
        where: { weekOf: { gte: weekStart } },
        take: 1,
        orderBy: { weekOf: "desc" },
      },
      medicalAlerts: {
        where: { isResolved: false },
        select: { id: true, severity: true },
      },
    },
    orderBy: { intakeDate: "asc" },
  })

  const overdueCount = assignedAnimals.filter((a) => a.progressNotes.length === 0).length
  const totalCount = assignedAnimals.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Foster Animals</h1>
        <p className="text-sm text-slate-500 mt-1">
          {totalCount === 0
            ? "You have no animals assigned yet."
            : `You are currently fostering ${totalCount} animal${totalCount !== 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Animals in My Care"
          value={totalCount}
          color="blue"
          icon={<PawPrint className="w-5 h-5" />}
        />
        <StatCard
          label="Notes Overdue"
          value={overdueCount}
          sublabel="No note submitted this week"
          color={overdueCount > 0 ? "yellow" : "green"}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label="Up to Date"
          value={totalCount - overdueCount}
          sublabel="Note submitted this week"
          color="green"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Overdue notice */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            <strong>{overdueCount}</strong> animal{overdueCount !== 1 ? "s" : ""} need{overdueCount === 1 ? "s" : ""} a
            progress note. Please submit a note for any animal highlighted below.
          </p>
        </div>
      )}

      {/* Animal list */}
      <Card title="My Animals">
        {assignedAnimals.length === 0 ? (
          <CardEmpty message="No animals assigned to you yet." />
        ) : (
          assignedAnimals.map((animal) => {
            const isOverdue = animal.progressNotes.length === 0
            const hasCritical = animal.medicalAlerts.some((a) => a.severity === "CRITICAL")

            return (
              <CardRow key={animal.id} className={isOverdue ? "bg-yellow-50/50" : ""}>
                <div className="flex items-center gap-3 min-w-0">
                  {/* Overdue dot */}
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      isOverdue ? "bg-yellow-400" : "bg-green-400"
                    }`}
                    title={isOverdue ? "Note overdue" : "Note submitted"}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/animals/${animal.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-blue-600"
                    >
                      {animal.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {animal.species}
                      {" · "}Intake {formatDate(animal.intakeDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasCritical && (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Critical Alert
                    </span>
                  )}
                  <AnimalStatusBadge status={animal.status} />
                  {isOverdue && (
                    <Link
                      href={`/dashboard/animals/${animal.id}`}
                      className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      Add note
                    </Link>
                  )}
                </div>
              </CardRow>
            )
          })
        )}
      </Card>
    </div>
  )
}
