import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"

// ---------------------------------------------------------------------------
// PATCH /api/animals/[id]/alerts/[alertId]  — resolve alert (MO + RL)
// ---------------------------------------------------------------------------
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; alertId: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["MEDICAL_OFFICER", "RESCUE_LEAD"])

    const { alertId } = await params

    const alert = await prisma.medicalAlert.findUnique({
      where:  { id: alertId },
      select: { id: true, isResolved: true },
    })
    if (!alert) throw new NotFoundError("Alert")

    const resolved = await prisma.medicalAlert.update({
      where: { id: alertId },
      data: {
        isResolved:  true,
        resolvedAt:  new Date(),
        resolvedById: session!.user.id,
      },
      include: {
        createdBy:  { select: { name: true } },
        resolvedBy: { select: { name: true } },
      },
    })

    return NextResponse.json(resolved)
  } catch (err) {
    return apiError(err)
  }
}
