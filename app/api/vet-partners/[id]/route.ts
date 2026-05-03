import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"
import { z } from "zod"

const VetPartnerUpdateSchema = z.object({
  name:        z.string().min(1).max(120).optional(),
  clinicName:  z.string().min(1).max(120).optional(),
  phone:       z.string().max(30).optional().nullable(),
  email:       z.string().email().optional().nullable().or(z.literal("")),
  address:     z.string().max(300).optional().nullable(),
  specialties: z.array(z.string().max(80)).optional(),
  notes:       z.string().max(2000).optional().nullable(),
})

// ---------------------------------------------------------------------------
// PATCH /api/vet-partners/[id]  — Rescue Lead only
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const { id } = await params

    const existing = await prisma.vetPartner.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError("Vet Partner")

    const body = VetPartnerUpdateSchema.parse(await req.json())

    // Resolve phone/email: use patched value if provided, otherwise keep existing
    const phone = body.phone !== undefined ? (body.phone || null) : existing.phone
    const email = body.email !== undefined ? (body.email || null) : existing.email

    if (!phone && !email) {
      return NextResponse.json(
        { error: "At least one of phone or email is required." },
        { status: 400 },
      )
    }

    const updated = await prisma.vetPartner.update({
      where: { id },
      data: {
        ...(body.name        !== undefined && { name:        body.name }),
        ...(body.clinicName  !== undefined && { clinicName:  body.clinicName }),
        ...(body.specialties !== undefined && { specialties: body.specialties }),
        ...(body.address     !== undefined && { address:     body.address     ?? null }),
        ...(body.notes       !== undefined && { notes:       body.notes       ?? null }),
        phone,
        email,
      },
      include: { addedBy: { select: { name: true } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/vet-partners/[id]  — Rescue Lead only (hard delete, safe)
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const { id } = await params

    const existing = await prisma.vetPartner.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError("Vet Partner")

    await prisma.vetPartner.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}
