import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError, PermissionError } from "@/lib/permissions"
import { z } from "zod"

const PersonalityUpdateSchema = z.object({
  traits:       z.array(z.string()).optional(),
  energyLevel:  z.string().max(50).optional().nullable(),
  goodWithKids: z.boolean().optional().nullable(),
  goodWithDogs: z.boolean().optional().nullable(),
  goodWithCats: z.boolean().optional().nullable(),
  idealHome:    z.string().max(1000).optional().nullable(),
})

// ---------------------------------------------------------------------------
// GET /api/animals/[id]/personality
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, [
      "FOSTER_PARENT",
      "ADOPTION_COUNSELOR",
      "RESCUE_LEAD",
      "INTAKE_SPECIALIST",
      "MEDICAL_OFFICER",
    ])

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
      throw new PermissionError("Not assigned to this animal")
    }

    const profile = await prisma.personalityProfile.findUnique({
      where: { animalId },
    })

    return NextResponse.json(profile ?? null)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/animals/[id]/personality — owner foster + Rescue Lead (upsert)
// ---------------------------------------------------------------------------
export async function PATCH(
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
      throw new PermissionError("Not assigned to this animal")
    }

    const body = PersonalityUpdateSchema.parse(await req.json())

    const profile = await prisma.personalityProfile.upsert({
      where:  { animalId },
      update: { ...body, updatedById: session!.user.id },
      create: {
        animalId,
        traits:       body.traits       ?? [],
        energyLevel:  body.energyLevel  ?? null,
        goodWithKids: body.goodWithKids ?? null,
        goodWithDogs: body.goodWithDogs ?? null,
        goodWithCats: body.goodWithCats ?? null,
        idealHome:    body.idealHome    ?? null,
        updatedById:  session!.user.id,
      },
    })

    return NextResponse.json(profile)
  } catch (err) {
    return apiError(err)
  }
}
