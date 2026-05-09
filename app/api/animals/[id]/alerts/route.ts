import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"
import { sendMedicalAlertEmail } from "@/lib/mailer"
import { z } from "zod"

const AlertCreateSchema = z.object({
  description: z.string().min(1).max(500),
  severity:    z.enum(["CRITICAL", "INFORMATIONAL"]),
})

// ---------------------------------------------------------------------------
// GET /api/animals/[id]/alerts  — all authenticated roles
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, [
      "RESCUE_LEAD",
      "INTAKE_SPECIALIST",
      "FOSTER_PARENT",
      "MEDICAL_OFFICER",
      "ADOPTION_COUNSELOR",
    ])

    const { id: animalId } = await params
    const { searchParams } = new URL(req.url)
    const includeResolved = searchParams.get("includeResolved") === "true"

    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { id: true },
    })
    if (!animal) throw new NotFoundError("Animal")

    const alerts = await prisma.medicalAlert.findMany({
      where:   includeResolved ? { animalId } : { animalId, isResolved: false },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy:  { select: { name: true } },
        resolvedBy: { select: { name: true } },
      },
    })

    return NextResponse.json(alerts)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/animals/[id]/alerts
// Medical Officer + Rescue Lead: full access
// Foster Parent: own assigned animal only; description is auto-prefixed
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["MEDICAL_OFFICER", "RESCUE_LEAD", "FOSTER_PARENT"])

    const { id: animalId } = await params

    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { id: true, name: true, fosterParentId: true },
    })
    if (!animal) throw new NotFoundError("Animal")

    // Foster Parents may only flag concerns for their own assigned animal
    if (
      session!.user.role === "FOSTER_PARENT" &&
      animal.fosterParentId !== session!.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = AlertCreateSchema.parse(await req.json())

    // Story 29 — prefix description when a Foster Parent flags a concern
    const description =
      session!.user.role === "FOSTER_PARENT"
        ? `Concern flagged by Foster Parent: ${body.description}`
        : body.description

    const alert = await prisma.medicalAlert.create({
      data: {
        animalId,
        createdById: session!.user.id,
        description,
        severity:    body.severity,
      },
      include: { createdBy: { select: { name: true } } },
    })

    // ── Notify Rescue Leads on CRITICAL alerts ───────────────────────────────
    // Isolated try/catch: email failure must never break the 201 response.
    if (body.severity === "CRITICAL") {
      try {
        const leads = await prisma.user.findMany({
          where:  { role: "RESCUE_LEAD", isActive: true },
          select: { email: true },
        })
        await sendMedicalAlertEmail({
          animalName:  animal.name,
          animalId,
          description: body.description,
          placedBy:    session!.user.name ?? "Staff",
          to:          leads.map((l) => l.email),
        })
      } catch (notifyErr) {
        console.error("[mailer] Failed to notify leads of critical alert:", notifyErr)
      }
    }

    return NextResponse.json(alert, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
