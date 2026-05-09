import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, NotFoundError } from "@/lib/permissions";
import {
  sendMeetGreetEmail,
  sendMeetGreetAdopterEmail,
  sendRecommendationEmail,
  sendAdoptionDecisionEmail,
} from "@/lib/mailer";
import type { Recommendation, ApplicationStatus } from "@prisma/client";

const HOME_CHECK_STATUSES = ["Pending", "Passed", "Failed"] as const;

const VALID_RECOMMENDATIONS = new Set<Recommendation>([
  "APPROVE",
  "DENY",
  "WAITLIST",
]);

// Statuses from which a recommendation can be submitted (includes RECOMMENDED for re-submission)
const RECOMMENDATION_ALLOWED = new Set([
  "MEET_GREET_SCHEDULED",
  "UNDER_REVIEW",
  "RECOMMENDED",
]);

// ---------------------------------------------------------------------------
// GET /api/applications/[id]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    requireRole(session, ["ADOPTION_COUNSELOR", "RESCUE_LEAD"]);

    const { id } = await params;

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
    });

    if (!application) throw new NotFoundError("Application");

    return NextResponse.json(application);
  } catch (err) {
    return apiError(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id]
//
// Four branches dispatched by payload shape:
//   1. "meetGreetAt" in body  → schedule Meet & Greet     (COUNSELOR + LEAD)
//   2. "recommendation" in body → submit recommendation   (COUNSELOR + LEAD)
//   3. "status": APPROVED|DENIED → final decision         (LEAD only)
//   4. else                   → screening notes / home check (existing logic)
//
// Terminal guard: APPROVED or DENIED applications reject all mutations (403).
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    requireRole(session, ["ADOPTION_COUNSELOR", "RESCUE_LEAD"]);

    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    // ── Load current state (expanded — feeds all branches) ────────────────────
    const current = await prisma.adopterApplication.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        animalId: true,
        applicantName: true,
        applicantEmail: true,
        counselorId: true,
        animal: { select: { id: true, name: true } },
      },
    });
    if (!current) throw new NotFoundError("Application");

    // ── Terminal guard ────────────────────────────────────────────────────────
    if (current.status === "APPROVED" || current.status === "DENIED") {
      return NextResponse.json(
        { error: "Application is closed." },
        { status: 403 },
      );
    }

    // =========================================================================
    // Branch 1 — Meet & Greet
    // =========================================================================
    if ("meetGreetAt" in body) {
      const date = new Date(body.meetGreetAt as string);
      if (isNaN(date.getTime()) || date <= new Date()) {
        return NextResponse.json(
          { error: "Meet & Greet must be scheduled in the future." },
          { status: 400 },
        );
      }

      const updated = await prisma.adopterApplication.update({
        where: { id },
        data: {
          meetGreetAt: date,
          status: "MEET_GREET_SCHEDULED",
          counselorId: session.user.id,
        },
        include: {
          counselor: { select: { id: true, name: true } },
          animal: {
            include: {
              fosterParent: { select: { name: true, email: true } },
            },
          },
        },
      });

      // Emails — both fire-and-forget; failure must never break the 200 response
      void (async () => {
        try {
          // Story 27 — notify adopter
          await sendMeetGreetAdopterEmail({
            to:            current.applicantEmail,
            applicantName: current.applicantName,
            animalName:    updated.animal.name,
            meetGreetAt:   date,
          });
        } catch (err) {
          console.error("[mailer] Failed to send Meet & Greet email to adopter:", err);
        }

        try {
          // Existing — notify foster parent
          const fp = updated.animal.fosterParent;
          if (fp?.email) {
            await sendMeetGreetEmail({
              animalName:    updated.animal.name,
              applicantName: current.applicantName,
              meetGreetAt:   date,
              scheduledBy:   session.user.name ?? "Staff",
              to:            fp.email,
            });
          }
        } catch (err) {
          console.error("[mailer] Failed to send Meet & Greet email to foster parent:", err);
        }
      })();

      return NextResponse.json(updated);
    }

    // =========================================================================
    // Branch 2 — Recommendation
    // =========================================================================
    if ("recommendation" in body) {
      if (!RECOMMENDATION_ALLOWED.has(current.status)) {
        return NextResponse.json(
          {
            error:
              "Recommendation requires status MEET_GREET_SCHEDULED, UNDER_REVIEW, or RECOMMENDED.",
          },
          { status: 409 },
        );
      }

      if (!VALID_RECOMMENDATIONS.has(body.recommendation as Recommendation)) {
        return NextResponse.json(
          { error: "Invalid recommendation value." },
          { status: 400 },
        );
      }

      const updated = await prisma.adopterApplication.update({
        where: { id },
        data: {
          recommendation: body.recommendation as Recommendation,
          recommendedAt: new Date(),
          status: "RECOMMENDED",
          counselorId: session.user.id,
        },
        include: {
          counselor: { select: { id: true, name: true } },
          animal: { select: { id: true, name: true } },
        },
      });

      // Email all active Rescue Leads — isolated: failure must never break the 200 response
      try {
        const leads = await prisma.user.findMany({
          where: { role: "RESCUE_LEAD", isActive: true },
          select: { email: true },
        });
        await sendRecommendationEmail({
          animalName: current.animal.name,
          applicantName: current.applicantName,
          recommendation: String(body.recommendation),
          counselorName: session.user.name ?? "Counselor",
          applicationId: id,
          to: leads.map((l) => l.email),
        });
      } catch (notifyErr) {
        console.error("[mailer] Failed to notify leads of recommendation:", notifyErr);
      }

      return NextResponse.json(updated);
    }

    // =========================================================================
    // Branch 3 — Final Decision (RESCUE_LEAD only)
    // =========================================================================
    if (body.status === "APPROVED" || body.status === "DENIED") {
      requireRole(session, ["RESCUE_LEAD"]); // LEAD only — re-check here

      if (current.status !== "RECOMMENDED") {
        return NextResponse.json(
          { error: "Final decision requires status RECOMMENDED." },
          { status: 409 },
        );
      }

      const decisionNotes =
        typeof body.decisionNotes === "string"
          ? body.decisionNotes || null
          : null;

      // ── APPROVED — transactional path ──────────────────────────────────────
      if (body.status === "APPROVED") {
        try {
          const approvedApp = await prisma.$transaction(async (tx) => {
            // Re-read inside the transaction to prevent a double-approval race
            const fresh = await tx.adopterApplication.findUnique({
              where: { id },
              select: { status: true, animalId: true },
            });
            if (!fresh || fresh.status !== "RECOMMENDED") {
              throw new Error("STALE_STATE");
            }

            // Critical alert gate — enforced inside transaction
            const blockers = await tx.medicalAlert.count({
              where: {
                animalId: fresh.animalId,
                severity: "CRITICAL",
                isResolved: false,
              },
            });
            if (blockers > 0) {
              throw new Error("ALERT_BLOCK");
            }

            // Advance animal to ADOPTED
            await tx.animal.update({
              where: { id: fresh.animalId },
              data: { status: "ADOPTED" },
            });

            // Close all competing active applications for this animal
            await tx.adopterApplication.updateMany({
              where: {
                animalId: fresh.animalId,
                id: { not: id },
                status: {
                  in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "MEET_GREET_SCHEDULED",
                    "RECOMMENDED",
                  ],
                },
              },
              data: { status: "DENIED", decisionNotes: "Animal adopted" },
            });

            // Approve this application
            return tx.adopterApplication.update({
              where: { id },
              data: {
                status: "APPROVED",
                decidedById: session.user.id,
                decidedAt: new Date(),
                decisionNotes,
                // counselorId intentionally not overwritten
              },
              include: {
                counselor: { select: { id: true, name: true } },
                animal: { select: { id: true, name: true } },
              },
            });
          });

          // Email applicant — isolated: failure must never break the 200 response
          try {
            await sendAdoptionDecisionEmail({
              applicantName: current.applicantName,
              animalName: current.animal.name,
              approved: true,
              to: current.applicantEmail,
            });
          } catch (notifyErr) {
            console.error("[mailer] Failed to send adoption approval email:", notifyErr);
          }

          return NextResponse.json(approvedApp);
        } catch (txErr) {
          if (txErr instanceof Error && txErr.message === "STALE_STATE") {
            return NextResponse.json(
              { error: "Application was already decided." },
              { status: 409 },
            );
          }
          if (txErr instanceof Error && txErr.message === "ALERT_BLOCK") {
            return NextResponse.json(
              {
                error:
                  "Unresolved Critical Medical Alerts block adoption approval.",
              },
              { status: 409 },
            );
          }
          throw txErr; // unexpected — re-throw to outer catch
        }
      }

      // ── DENIED ─────────────────────────────────────────────────────────────
      const denied = await prisma.adopterApplication.update({
        where: { id },
        data: {
          status: "DENIED",
          decidedById: session.user.id,
          decidedAt: new Date(),
          decisionNotes,
          // counselorId intentionally not overwritten
        },
        include: {
          counselor: { select: { id: true, name: true } },
          animal: { select: { id: true, name: true } },
        },
      });

      // Email applicant — isolated: failure must never break the 200 response
      try {
        await sendAdoptionDecisionEmail({
          applicantName: current.applicantName,
          animalName: current.animal.name,
          approved: false,
          to: current.applicantEmail,
        });
      } catch (notifyErr) {
        console.error("[mailer] Failed to send adoption denial email:", notifyErr);
      }

      return NextResponse.json(denied);
    }

    // =========================================================================
    // Branch 4 — Screening (existing logic, preserved exactly)
    // =========================================================================
    type UpdateData = Parameters<
      typeof prisma.adopterApplication.update
    >[0]["data"];
    const data: UpdateData = {};

    if (typeof body.screeningNotes === "string") {
      data.screeningNotes = body.screeningNotes || null;
    }

    if (
      typeof body.homeCheckStatus === "string" &&
      HOME_CHECK_STATUSES.includes(
        body.homeCheckStatus as (typeof HOME_CHECK_STATUSES)[number],
      )
    ) {
      data.homeCheckStatus = body.homeCheckStatus;
    }

    // Claim: counselorId always set in screening branch
    data.counselorId = session.user.id;

    // Auto-transition SUBMITTED → UNDER_REVIEW on first edit
    let newStatus: ApplicationStatus = current.status;
    if (current.status === "SUBMITTED") {
      newStatus = "UNDER_REVIEW";
    }

    // Counselor or Rescue Lead can directly deny when home check fails
    if (
      body.homeCheckStatus === "Failed" &&
      (session.user.role === "ADOPTION_COUNSELOR" ||
        session.user.role === "RESCUE_LEAD")
    ) {
      newStatus = "DENIED";
      data.decidedById = session.user.id;
      data.decidedAt = new Date();
    }

    data.status = newStatus;

    const updated = await prisma.adopterApplication.update({
      where: { id },
      data,
      include: {
        counselor: { select: { id: true, name: true } },
        animal: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return apiError(err);
  }
}
