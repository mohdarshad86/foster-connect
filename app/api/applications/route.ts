import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, apiError } from "@/lib/permissions"
import { ApplicationCreateSchema } from "@/lib/validators/application"
import { isRateLimited } from "@/lib/rateLimit"
import {
  sendNewApplicationEmail,
  sendApplicationConfirmationEmail,
} from "@/lib/mailer"
import { ACTIVE_APPLICATION_STATUSES } from "@/lib/statusMachine"
import type { ApplicationStatus } from "@prisma/client"

const ALL_STATUSES: ApplicationStatus[] = [
  "SUBMITTED", "UNDER_REVIEW", "MEET_GREET_SCHEDULED",
  "RECOMMENDED", "APPROVED", "DENIED", "WAITLISTED",
]

// ---------------------------------------------------------------------------
// GET /api/applications — Adoption Counselor + Rescue Lead
// Query params:
//   status=active          → SUBMITTED + UNDER_REVIEW (default)
//   status=<ApplicationStatus> → specific status
//   status=all             → every status
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    requireRole(session, ["ADOPTION_COUNSELOR", "RESCUE_LEAD"])

    const statusParam = req.nextUrl.searchParams.get("status") ?? "active"

    let statusFilter: ApplicationStatus | ApplicationStatus[] | undefined
    if (statusParam === "active") {
      statusFilter = ACTIVE_APPLICATION_STATUSES
    } else if (statusParam === "all") {
      statusFilter = undefined // no filter
    } else if (ALL_STATUSES.includes(statusParam as ApplicationStatus)) {
      statusFilter = statusParam as ApplicationStatus
    } else {
      statusFilter = ACTIVE_APPLICATION_STATUSES
    }

    const applications = await prisma.adopterApplication.findMany({
      where: statusFilter
        ? { status: Array.isArray(statusFilter) ? { in: statusFilter } : statusFilter }
        : undefined,
      orderBy: { submittedAt: "desc" },
      select: {
        id:            true,
        applicantName: true,
        applicantEmail: true,
        status:        true,
        submittedAt:   true,
        counselor:     { select: { id: true, name: true } },
        animal:        { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(applications)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/applications
// Public endpoint — no authentication required.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many applications. Please try again later." },
        { status: 429 },
      )
    }

    // ── Validate body ────────────────────────────────────────────────────────
    const body = await req.json()
    const parsed = ApplicationCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const {
      animalId,
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantAddress,
      householdNotes,
    } = parsed.data

    // ── Animal status check ──────────────────────────────────────────────────
    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { id: true, status: true, name: true },
    })

    if (!animal) {
      return NextResponse.json(
        { error: "Animal not found." },
        { status: 404 },
      )
    }

    if (animal.status !== "ADOPTION_READY") {
      return NextResponse.json(
        { error: "This animal is not currently available for adoption." },
        { status: 422 },
      )
    }

    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await prisma.adopterApplication.findFirst({
      where: {
        animalId,
        applicantEmail: { equals: applicantEmail, mode: "insensitive" },
        status: { not: "DENIED" },
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        {
          code:       "DUPLICATE_APPLICATION",
          animalName: animal.name,
          email:      applicantEmail,
        },
        { status: 409 },
      )
    }

    // ── Create application ───────────────────────────────────────────────────
    const application = await prisma.adopterApplication.create({
      data: {
        animalId,
        applicantName,
        applicantEmail,
        applicantPhone:   applicantPhone  || null,
        applicantAddress: applicantAddress || null,
        householdNotes:   householdNotes   || null,
        status: "SUBMITTED",
      },
      select: { id: true, submittedAt: true },
    })

    // ── Fire-and-forget emails (failures must never break the 201 response) ──
    void (async () => {
      try {
        // Story 24 — confirmation to adopter
        await sendApplicationConfirmationEmail({
          to:           applicantEmail,
          applicantName,
          animalName:   animal.name,
          submittedAt:  application.submittedAt,
        })
      } catch (err) {
        console.error("[mailer] Failed to send adopter confirmation:", err)
      }

      try {
        // Story 39 — notify all active Adoption Counselors
        const counselors = await prisma.user.findMany({
          where:  { role: "ADOPTION_COUNSELOR", isActive: true },
          select: { email: true },
        })
        await sendNewApplicationEmail({
          animalName:    animal.name,
          applicantName,
          applicationId: application.id,
          submittedAt:   application.submittedAt,
          to:            counselors.map((c) => c.email),
        })
      } catch (err) {
        console.error("[mailer] Failed to notify counselors of new application:", err)
      }
    })()

    return NextResponse.json(application, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
