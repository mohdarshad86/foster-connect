import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"
import { MedicalRecordCreateSchema } from "@/lib/validators/medicalRecord"

// ---------------------------------------------------------------------------
// GET /api/animals/[id]/medical  — Medical Officer + Rescue Lead
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["MEDICAL_OFFICER", "RESCUE_LEAD"])

    const { id: animalId } = await params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // VACCINATION | SURGERY | MEDICATION

    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { id: true },
    })
    if (!animal) throw new NotFoundError("Animal")

    const where = {
      animalId,
      isVoided: false,
      ...(type === "VACCINATION" || type === "SURGERY" || type === "MEDICATION"
        ? { type: type as "VACCINATION" | "SURGERY" | "MEDICATION" }
        : {}),
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      orderBy: { date: "desc" },
      include: { createdBy: { select: { name: true } } },
    })

    return NextResponse.json(records)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/animals/[id]/medical  — Medical Officer + Rescue Lead
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["MEDICAL_OFFICER", "RESCUE_LEAD"])

    const { id: animalId } = await params

    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { id: true },
    })
    if (!animal) throw new NotFoundError("Animal")

    const body = MedicalRecordCreateSchema.parse(await req.json())

    const record = await prisma.medicalRecord.create({
      data: {
        animalId,
        createdById: session!.user.id,
        type:  body.type,
        date:  new Date(body.date),
        notes: body.notes ?? null,
        ...(body.type === "VACCINATION" && {
          vaccineName: body.vaccineName,
          nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        }),
        ...(body.type === "SURGERY" && {
          surgeryType:   body.surgeryType,
          outcome:       body.outcome       ?? null,
          recoveryNotes: body.recoveryNotes ?? null,
        }),
        ...(body.type === "MEDICATION" && {
          drugName:            body.drugName,
          dosage:              body.dosage            ?? null,
          frequency:           body.frequency         ?? null,
          medicationEndDate:   body.medicationEndDate ? new Date(body.medicationEndDate) : null,
        }),
      },
      include: { createdBy: { select: { name: true } } },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
