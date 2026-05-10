import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardEmpty } from "@/components/ui/Card"
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge"
import { PlusCircle, PawPrint } from "lucide-react"

export async function IntakeSpecialistDashboard() {
  const [intakeCount, recentAnimals] = await Promise.all([
    prisma.animal.count({ where: { status: "INTAKE" } }),
    prisma.animal.findMany({
      orderBy: { intakeDate: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        intakeDate: true,
        status: true,
      },
    }),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Intake Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage incoming animals and track recent intakes.
          </p>
        </div>
        <Link
          href="/animals/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Intake
        </Link>
      </div>

      {/* Stat */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Animals in Intake"
          value={intakeCount}
          sublabel="Awaiting foster assignment"
          color="gray"
          icon={<PawPrint className="w-5 h-5" />}
        />
        <StatCard
          label="Total on Record"
          value={recentAnimals.length < 10 ? recentAnimals.length : "10+"}
          sublabel="Showing 10 most recent"
          color="blue"
          icon={<PawPrint className="w-5 h-5" />}
        />
      </div>

      {/* Recent Intakes Table */}
      <Card
        title="Recent Intakes"
        action={<span className="text-xs text-slate-400">Last 10</span>}
      >
        {recentAnimals.length === 0 ? (
          <CardEmpty message="No animals on record yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Name</th>
                <th className="text-left pb-2 font-medium">Species / Breed</th>
                <th className="text-left pb-2 font-medium">Intake Date</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAnimals.map((animal) => (
                <tr
                  key={animal.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/dashboard/animals/${animal.id}`}
                      className="font-medium text-slate-800 hover:text-blue-600"
                    >
                      {animal.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {animal.species}
                    {animal.breed ? ` · ${animal.breed}` : ""}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">
                    {formatDate(animal.intakeDate)}
                  </td>
                  <td className="py-2.5">
                    <AnimalStatusBadge status={animal.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
