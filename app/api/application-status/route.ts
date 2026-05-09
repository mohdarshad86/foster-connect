import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isStatusLookupLimited } from "@/lib/rateLimit"
import type { ApplicationStatus } from "@prisma/client"

// Human-readable labels — no internal detail exposed to the public
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED:            "Received",
  UNDER_REVIEW:         "Under Review",
  MEET_GREET_SCHEDULED: "Meet & Greet Scheduled",
  RECOMMENDED:          "Under Review",   // internal step, shown as Under Review
  APPROVED:             "Approved",
  DENIED:               "Not Approved",
  WAITLISTED:           "Waitlisted",
}

// ---------------------------------------------------------------------------
// GET /api/application-status?email=...&animalName=...
// Public endpoint — no authentication required.
// Rate-limited to 10 req/hr per IP.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  if (isStatusLookupLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    )
  }

  const email      = req.nextUrl.searchParams.get("email")?.trim()
  const animalName = req.nextUrl.searchParams.get("animalName")?.trim()

  if (!email || !animalName) {
    return NextResponse.json(
      { error: "email and animalName are required." },
      { status: 400 },
    )
  }

  const application = await prisma.adopterApplication.findFirst({
    where: {
      applicantEmail: { equals: email,      mode: "insensitive" },
      animal:         { name: { contains: animalName, mode: "insensitive" } },
    },
    orderBy: { submittedAt: "desc" },
    select: {
      status:      true,
      submittedAt: true,
      meetGreetAt: true,
      animal: {
        select: {
          name:         true,
          primaryPhoto: true,
        },
      },
    },
  })

  if (!application) {
    return NextResponse.json({ found: false })
  }

  // Return only safe public fields — no screening notes, counselor info, or decision reasons
  return NextResponse.json({
    found:       true,
    status:      application.status,
    statusLabel: STATUS_LABELS[application.status],
    animalName:  application.animal.name,
    animalPhoto: application.animal.primaryPhoto,
    submittedAt: application.submittedAt.toISOString(),
    meetGreetAt: application.meetGreetAt?.toISOString() ?? null,
  })
}
