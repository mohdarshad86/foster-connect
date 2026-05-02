import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"
import { assertValidTransition } from "@/lib/statusMachine"
import type { AnimalStatus } from "@prisma/client"

const ANIMAL_STATUSES: AnimalStatus[] = [
  "INTAKE", "IN_FOSTER", "ADOPTION_READY", "PENDING_ADOPTION", "ADOPTED",
]

// ---------------------------------------------------------------------------
// GET /api/animals/[id]
// Returns a role-aware payload:
//   base fields + personalityProfile — all roles
//   progressNotes                    — owner Foster Parent or staff
//   medicalRecords (non-voided)      — Medical Officer + Rescue Lead
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    requireRole(session, [
      "RESCUE_LEAD", "INTAKE_SPECIALIST", "FOSTER_PARENT",
      "MEDICAL_OFFICER", "ADOPTION_COUNSELOR",
    ])

    const { id } = await params
    const role = session.user.role

    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        intakeSpecialist:   { select: { name: true } },
        fosterParent:       { select: { id: true, name: true } },
        medicalAlerts:      { where: { isResolved: false }, orderBy: { createdAt: "desc" } },
        photos:             { orderBy: { uploadedAt: "desc" } },
        personalityProfile: true,
      },
    })
    if (!animal) throw new NotFoundError("Animal")

    const isOwnerFoster =
      role === "FOSTER_PARENT" && animal.fosterParentId === session.user.id
    const isStaff =
      ["RESCUE_LEAD", "INTAKE_SPECIALIST", "MEDICAL_OFFICER", "ADOPTION_COUNSELOR"].includes(role)

    const [progressNotes, medicalRecords] = await Promise.all([
      isOwnerFoster || isStaff
        ? prisma.progressNote.findMany({
            where:   { animalId: id },
            orderBy: { weekOf: "desc" },
          })
        : Promise.resolve(undefined),

      role === "MEDICAL_OFFICER" || role === "RESCUE_LEAD"
        ? prisma.medicalRecord.findMany({
            where:   { animalId: id, isVoided: false },
            orderBy: { date: "desc" },
          })
        : Promise.resolve(undefined),
    ])

    return NextResponse.json({ ...animal, progressNotes, medicalRecords })
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/animals/[id]
//
// Supported body fields:
//   primaryPhoto   – string  – any upload-capable role (INTAKE, FOSTER own, LEAD)
//   fosterParentId – string  – RESCUE_LEAD only; auto-transitions INTAKE → IN_FOSTER
//   status         – AnimalStatus – RESCUE_LEAD only; validated by status machine
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    requireRole(session, [
      "RESCUE_LEAD", "INTAKE_SPECIALIST", "FOSTER_PARENT",
    ])

    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    const animal = await prisma.animal.findUnique({ where: { id } })
    if (!animal) throw new NotFoundError("Animal")

    // ── Non-Lead roles: primaryPhoto only ────────────────────────────────────
    if (session.user.role !== "RESCUE_LEAD") {
      // Foster Parents are restricted to their own animal
      if (
        session.user.role === "FOSTER_PARENT" &&
        animal.fosterParentId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (typeof body.primaryPhoto !== "string") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const updated = await prisma.animal.update({
        where: { id },
        data: { primaryPhoto: body.primaryPhoto },
      })
      return NextResponse.json(updated)
    }

    // ── RESCUE_LEAD ──────────────────────────────────────────────────────────
    // Build the update payload incrementally
    type UpdateData = Parameters<typeof prisma.animal.update>[0]["data"]
    const data: UpdateData = {}

    // ── primaryPhoto
    if (typeof body.primaryPhoto === "string") {
      data.primaryPhoto = body.primaryPhoto
    }

    // ── fosterParentId — assign / reassign a foster parent
    if (body.fosterParentId !== undefined) {
      if (body.fosterParentId === null) {
        // Explicit un-assign (future use)
        data.fosterParentId = null
      } else if (typeof body.fosterParentId === "string") {
        const foster = await prisma.user.findFirst({
          where: { id: body.fosterParentId, role: "FOSTER_PARENT", isActive: true },
          select: { id: true },
        })
        if (!foster) {
          return NextResponse.json(
            { error: "Foster parent not found or not active" },
            { status: 400 }
          )
        }

        data.fosterParentId = body.fosterParentId

        // Auto-transition INTAKE → IN_FOSTER when a foster is assigned
        if (animal.status === "INTAKE") {
          assertValidTransition(animal.status, "IN_FOSTER")
          data.status = "IN_FOSTER"
          data.statusHistory = {
            push: {
              from: animal.status,
              to: "IN_FOSTER",
              changedById: session.user.id,
              changedAt: new Date(),
            },
          }
        }
      }
    }

    // ── status — explicit manual transition (not triggered by fosterParentId)
    if (typeof body.status === "string" && body.fosterParentId === undefined) {
      const toStatus = body.status as AnimalStatus
      if (!ANIMAL_STATUSES.includes(toStatus)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
      }

      assertValidTransition(animal.status, toStatus)
      data.status = toStatus
      data.statusHistory = {
        push: {
          from: animal.status,
          to: toStatus,
          changedById: session.user.id,
          changedAt: new Date(),
        },
      }

      // Reset to INTAKE → clear foster assignment
      if (toStatus === "INTAKE") {
        data.fosterParentId = null
      }
    }

    const updated = await prisma.animal.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    return apiError(err)
  }
}
