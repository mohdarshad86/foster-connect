import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"

// ---------------------------------------------------------------------------
// PATCH /api/users/[id]
// Supported body fields:
//   isActive – boolean – toggle account activation (Rescue Lead only)
//   force    – boolean – bypass the active-assignment guard (Story 40)
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    // Prevent self-deactivation
    if (id === session.user.id && body.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account." },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({
      where:  { id },
      select: { id: true, role: true },
    })
    if (!existing) throw new NotFoundError("User")

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean." },
        { status: 400 },
      )
    }

    // ── Story 40 — Guard: warn before deactivating a Foster with active animals
    if (
      body.isActive === false &&
      existing.role === "FOSTER_PARENT" &&
      body.force !== true
    ) {
      const activeAnimals = await prisma.animal.findMany({
        where: {
          fosterParentId: id,
          status: { not: "ADOPTED" },
        },
        select: { id: true, name: true },
      })

      if (activeAnimals.length > 0) {
        return NextResponse.json(
          {
            code:        "ACTIVE_ASSIGNMENTS",
            animalNames: activeAnimals.map((a) => a.name),
            animalIds:   activeAnimals.map((a) => a.id),
          },
          { status: 409 },
        )
      }
    }

    // ── Proceed with deactivation
    // If force === true, clear foster assignments on all non-adopted animals
    if (body.isActive === false && existing.role === "FOSTER_PARENT") {
      await prisma.animal.updateMany({
        where: { fosterParentId: id, status: { not: "ADOPTED" } },
        data:  { fosterParentId: null },
      })
    }

    const updated = await prisma.user.update({
      where: { id },
      data:  { isActive: body.isActive },
      select: {
        id:       true,
        name:     true,
        isActive: true,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return apiError(err)
  }
}
