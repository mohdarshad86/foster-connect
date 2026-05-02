import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"

const HOME_CHECK_STATUSES = ["Pending", "Passed", "Failed"] as const

// ---------------------------------------------------------------------------
// GET /api/applications/[id]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["ADOPTION_COUNSELOR", "RESCUE_LEAD"])

    const { id } = await params

    const application = await prisma.adopterApplication.findUnique({
      where: { id },
      include: {
        counselor: { select: { id: true, name: true } },
        animal: {
          include: {
            personalityProfile: true,
            photos: { take: 1, orderBy: { uploadedAt: "desc" } },
          },
        },
      },
    })

    if (!application) throw new NotFoundError("Application")

    return NextResponse.json(application)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id]
// Accepted body fields: screeningNotes, homeCheckStatus
//
// Side effects:
//   - Auto-transitions SUBMITTED → UNDER_REVIEW on first edit
//   - Sets counselorId to the current user (claim)
//   - If homeCheckStatus === 'Failed' and role is ADOPTION_COUNSELOR → DENIED
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["ADOPTION_COUNSELOR", "RESCUE_LEAD"])

    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    const current = await prisma.adopterApplication.findUnique({
      where:  { id },
      select: { id: true, status: true },
    })
    if (!current) throw new NotFoundError("Application")

    // Build update data incrementally
    type UpdateData = Parameters<typeof prisma.adopterApplication.update>[0]["data"]
    const data: UpdateData = {}

    // Screening notes
    if (typeof body.screeningNotes === "string") {
      data.screeningNotes = body.screeningNotes || null
    }

    // Home check status
    if (
      typeof body.homeCheckStatus === "string" &&
      HOME_CHECK_STATUSES.includes(body.homeCheckStatus as typeof HOME_CHECK_STATUSES[number])
    ) {
      data.homeCheckStatus = body.homeCheckStatus
    }

    // Always claim the application for the editing user
    data.counselorId = session.user.id

    // Auto-transition SUBMITTED → UNDER_REVIEW on first edit
    let newStatus = current.status
    if (current.status === "SUBMITTED") {
      newStatus = "UNDER_REVIEW"
    }

    // Counselor can directly deny when home check fails
    if (
      body.homeCheckStatus === "Failed" &&
      session.user.role === "ADOPTION_COUNSELOR"
    ) {
      newStatus = "DENIED"
    }

    // Rescue Lead adoption approval gate: block if unresolved Critical alerts exist
    if (body.status === "APPROVED" && session.user.role === "RESCUE_LEAD") {
      const app = await prisma.adopterApplication.findUnique({
        where:  { id },
        select: { animalId: true },
      })
      if (app) {
        const blockers = await prisma.medicalAlert.count({
          where: { animalId: app.animalId, severity: "CRITICAL", isResolved: false },
        })
        if (blockers > 0) {
          return NextResponse.json(
            { error: "Unresolved Critical Medical Alerts block adoption approval" },
            { status: 409 },
          )
        }
        newStatus = "APPROVED"
        data.decidedById = session.user.id
        data.decidedAt   = new Date()
        // Auto-advance animal to ADOPTED
        await prisma.animal.update({
          where: { id: app.animalId },
          data:  { status: "ADOPTED" },
        })
      }
    }

    // Rescue Lead deny decision
    if (body.status === "DENIED" && session.user.role === "RESCUE_LEAD") {
      newStatus            = "DENIED"
      data.decidedById     = session.user.id
      data.decidedAt       = new Date()
      if (typeof body.decisionNotes === "string") {
        data.decisionNotes = body.decisionNotes || null
      }
    }

    data.status = newStatus

    const updated = await prisma.adopterApplication.update({
      where: { id },
      data,
      include: {
        counselor: { select: { id: true, name: true } },
        animal:    { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return apiError(err)
  }
}
