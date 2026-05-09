import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"
import { z } from "zod"

const UpdateSchema = z.object({
  animalName:    z.string().min(1).max(100).optional(),
  blurb:         z.string().min(1).max(200).optional(),
  adoptionMonth: z.string().min(1).max(20).optional(),
  photoUrl:      z.string().nullable().optional(),
  isPublished:   z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// PATCH /api/success-stories/[id] — Rescue Lead only
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const { id } = await params
    const story  = await prisma.successStory.findUnique({ where: { id } })
    if (!story) throw new NotFoundError("Success story")

    const body    = UpdateSchema.parse(await req.json())
    const updated = await prisma.successStory.update({
      where: { id },
      data:  body,
    })
    return NextResponse.json(updated)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/success-stories/[id] — Rescue Lead only
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const { id } = await params
    const story  = await prisma.successStory.findUnique({ where: { id } })
    if (!story) throw new NotFoundError("Success story")

    await prisma.successStory.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}
