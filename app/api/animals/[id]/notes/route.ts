import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError, PermissionError } from "@/lib/permissions"
import { getWeekMonday } from "@/lib/utils"
import { z } from "zod"

const NoteCreateSchema = z.object({
  weekOf:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  noteText: z.string().min(20, "Note must be at least 20 characters"),
  weightKg: z.number().positive().optional().nullable(),
  force:    z.boolean().optional(), // true = allow duplicate week override
})

// ---------------------------------------------------------------------------
// GET /api/animals/[id]/notes  — owner foster + all staff
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, [
      "RESCUE_LEAD",
      "INTAKE_SPECIALIST",
      "MEDICAL_OFFICER",
      "ADOPTION_COUNSELOR",
      "FOSTER_PARENT",
    ])

    const { id: animalId } = await params

    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { fosterParentId: true },
    })
    if (!animal) throw new NotFoundError("Animal")

    const isFoster = session!.user.role === "FOSTER_PARENT"
    if (isFoster && animal.fosterParentId !== session!.user.id) {
      throw new PermissionError("You are not the assigned foster parent for this animal")
    }

    const notes = await prisma.progressNote.findMany({
      where:   { animalId },
      orderBy: { weekOf: "desc" },
      include: { fosterParent: { select: { name: true } } },
    })

    return NextResponse.json(notes)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/animals/[id]/notes  — owner foster + Rescue Lead
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["FOSTER_PARENT", "RESCUE_LEAD"])

    const { id: animalId } = await params

    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { fosterParentId: true },
    })
    if (!animal) throw new NotFoundError("Animal")

    if (
      session!.user.role === "FOSTER_PARENT" &&
      animal.fosterParentId !== session!.user.id
    ) {
      throw new PermissionError("You are not the assigned foster parent for this animal")
    }

    const body = NoteCreateSchema.parse(await req.json())

    const weekDate = getWeekMonday(new Date(body.weekOf))

    // Duplicate-week guard
    if (!body.force) {
      const existing = await prisma.progressNote.findFirst({
        where: { animalId, weekOf: weekDate },
      })
      if (existing) {
        return NextResponse.json(
          { error: "DUPLICATE_WEEK", message: "A note for this week already exists." },
          { status: 409 },
        )
      }
    }

    const note = await prisma.progressNote.create({
      data: {
        animalId,
        fosterParentId: session!.user.id,
        weekOf:   weekDate,
        noteText: body.noteText,
        weightKg: body.weightKg ?? null,
      },
      include: { fosterParent: { select: { name: true } } },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
