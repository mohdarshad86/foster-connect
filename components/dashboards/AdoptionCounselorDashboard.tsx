import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { ACTIVE_APPLICATION_STATUSES } from "@/lib/statusMachine"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardRow, CardEmpty } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { ClipboardList, CalendarClock, CheckCircle } from "lucide-react"

interface Props {
  userId: string
}

export async function AdoptionCounselorDashboard({ userId }: Props) {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [myApplications, upcomingMeetGreets] = await Promise.all([
    prisma.adopterApplication.findMany({
      where: {
        // Shared-queue query — no counselorId filter.
        // New submissions have counselorId = null until claimed; all must be visible here.
        status: { in: ACTIVE_APPLICATION_STATUSES },
      },
      include: {
        animal: { select: { id: true, name: true, species: true } },
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.adopterApplication.findMany({
      where: {
        counselorId: userId,
        meetGreetAt: { gte: now, lte: sevenDaysFromNow },
        status: { in: ["UNDER_REVIEW", "MEET_GREET_SCHEDULED"] },
      },
      select: {
        id: true,
        applicantName: true,
        meetGreetAt: true,
        status: true,
        animal: { select: { id: true, name: true } },
      },
      orderBy: { meetGreetAt: "asc" },
    }),
  ])

  const submittedCount = myApplications.filter((a) => a.status === "SUBMITTED").length
  const underReviewCount = myApplications.filter((a) => a.status === "UNDER_REVIEW").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Adoption Counselor Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage applications, schedule meet &amp; greets, and submit recommendations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="New Applications"
          value={submittedCount}
          sublabel="Awaiting review"
          color={submittedCount > 0 ? "yellow" : "green"}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          label="Under Review"
          value={underReviewCount}
          sublabel="In progress"
          color={underReviewCount > 0 ? "blue" : "green"}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          label="Meet &amp; Greets (7 days)"
          value={upcomingMeetGreets.length}
          sublabel="Scheduled soon"
          color={upcomingMeetGreets.length > 0 ? "blue" : "green"}
          icon={<CalendarClock className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Applications */}
        <Card
          title="Active Applications"
          action={
            myApplications.length > 0 ? (
              <Badge variant={submittedCount > 0 ? "yellow" : "blue"}>
                {myApplications.length}
              </Badge>
            ) : null
          }
        >
          {myApplications.length === 0 ? (
            <CardEmpty message="No active applications at the moment." />
          ) : (
            myApplications.map((app) => (
              <CardRow key={app.id}>
                <div className="min-w-0">
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                  >
                    {app.applicantName}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">
                    {app.animal.name} · {app.animal.species}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={app.status === "SUBMITTED" ? "yellow" : "blue"}>
                    {app.status === "SUBMITTED" ? "New" : "In Review"}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(app.submittedAt)}</p>
                </div>
              </CardRow>
            ))
          )}
        </Card>

        {/* Upcoming Meet & Greets */}
        <Card
          title="Upcoming Meet &amp; Greets"
          action={
            upcomingMeetGreets.length > 0 ? (
              <Badge variant="blue">{upcomingMeetGreets.length}</Badge>
            ) : null
          }
        >
          {upcomingMeetGreets.length === 0 ? (
            <CardEmpty message="No meet &amp; greets scheduled in the next 7 days." />
          ) : (
            upcomingMeetGreets.map((app) => (
              <CardRow key={app.id}>
                <div className="min-w-0">
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                  >
                    {app.applicantName}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{app.animal.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-blue-600">
                    {app.meetGreetAt ? formatDate(app.meetGreetAt) : "—"}
                  </p>
                  <span className="flex items-center justify-end gap-1 text-xs text-green-600 mt-0.5">
                    <CheckCircle className="w-3 h-3" /> Scheduled
                  </span>
                </div>
              </CardRow>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
