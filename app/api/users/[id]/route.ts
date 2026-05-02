import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"

// ---------------------------------------------------------------------------
// PATCH /api/users/[id]
// Supported body fields:
//   isActive – boolean – toggle account activation (Rescue Lead only)
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
      select: { id: true },
    })
    if (!existing) throw new NotFoundError("User")

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean." },
        { status: 400 },
      )
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
