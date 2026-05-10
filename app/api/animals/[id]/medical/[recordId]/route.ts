import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"

// ---------------------------------------------------------------------------
// PATCH /api/animals/[id]/medical/[recordId]
// Medical Officer + Rescue Lead only.
// Accepts: { isVoided: true }
// Voiding is permanent — isVoided: false is rejected.
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["MEDICAL_OFFICER", "RESCUE_LEAD"])

    const { id: animalId, recordId } = await params
    const body = await req.json() as Record<string, unknown>

    // Only accept isVoided: true — cannot un-void
    if (body.isVoided !== true) {
      return NextResponse.json(
        { error: "Only { isVoided: true } is accepted. Voiding is permanent." },
        { status: 400 },
      )
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
    })
    if (!record || record.animalId !== animalId) throw new NotFoundError("Medical record")

    if (record.isVoided) {
      return NextResponse.json(
        { error: "Record is already voided." },
        { status: 409 },
      )
    }

    const updated = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        isVoided:  true,
        voidedAt:  new Date(),
        // voidedById stored as plain string (no FK relation declared) for audit
      },
      include: { createdBy: { select: { name: true } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return apiError(err)
  }
}
