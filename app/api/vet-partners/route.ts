import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError } from "@/lib/permissions"
import { z } from "zod"

const VetPartnerCreateSchema = z.object({
  name:       z.string().min(1).max(120),
  clinicName: z.string().min(1).max(120),
  phone:      z.string().max(30).optional().nullable(),
  email:      z.string().email().optional().nullable().or(z.literal("")),
  address:    z.string().max(300).optional().nullable(),
  specialties: z.array(z.string().max(80)).optional().default([]),
  notes:      z.string().max(2000).optional().nullable(),
})

// ---------------------------------------------------------------------------
// GET /api/vet-partners  — Rescue Lead only; ?search= filters clinic/specialty
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const search = req.nextUrl.searchParams.get("search")?.trim() || undefined

    const partners = await prisma.vetPartner.findMany({
      where: search
        ? {
            OR: [
              { clinicName: { contains: search, mode: "insensitive" } },
              { specialties: { has: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { addedBy: { select: { name: true } } },
    })

    return NextResponse.json(partners)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/vet-partners  — Rescue Lead only
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const body = VetPartnerCreateSchema.parse(await req.json())

    const phone = body.phone || null
    const email = body.email || null

    if (!phone && !email) {
      return NextResponse.json(
        { error: "At least one of phone or email is required." },
        { status: 400 },
      )
    }

    const partner = await prisma.vetPartner.create({
      data: {
        name:        body.name,
        clinicName:  body.clinicName,
        phone,
        email,
        address:     body.address     ?? null,
        specialties: body.specialties ?? [],
        notes:       body.notes       ?? null,
        addedById:   session!.user.id,
      },
      include: { addedBy: { select: { name: true } } },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
