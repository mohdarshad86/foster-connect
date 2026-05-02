import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge"
import { PlusCircle } from "lucide-react"
import type { Role } from "@prisma/client"

const INTAKE_ROLES: Role[] = ["INTAKE_SPECIALIST", "RESCUE_LEAD"]

export default async function AnimalsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const canIntake = INTAKE_ROLES.includes(session.user.role as Role)

  const animals = await prisma.animal.findMany({
    orderBy: { intakeDate: "desc" },
    take: 50,
    select: {
      id:        true,
      name:      true,
      species:   true,
      breed:     true,
      sex:       true,
      status:    true,
      intakeDate: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Animals</h1>
          <p className="text-sm text-slate-500 mt-1">
            {animals.length} animal{animals.length !== 1 ? "s" : ""} on record
          </p>
        </div>
        {canIntake && (
          <Link
            href="/animals/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Intake
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {animals.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No animals on record yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Species / Breed</th>
                <th className="text-left px-5 py-3 font-medium">Sex</th>
                <th className="text-left px-5 py-3 font-medium">Intake Date</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((animal) => (
                <tr
                  key={animal.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/animals/${animal.id}`}
                      className="font-medium text-slate-800 hover:text-blue-600"
                    >
                      {animal.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {animal.species}{animal.breed ? ` · ${animal.breed}` : ""}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{animal.sex}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(animal.intakeDate)}</td>
                  <td className="px-5 py-3">
                    <AnimalStatusBadge status={animal.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
