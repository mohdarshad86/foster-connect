import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError } from "@/lib/permissions";
import { AnimalCreateSchema } from "@/lib/validators/animal";
import type { AnimalStatus } from "@prisma/client";

const ANIMAL_STATUSES: AnimalStatus[] = [
  "INTAKE", "IN_FOSTER", "ADOPTION_READY", "PENDING_ADOPTION", "ADOPTED",
];

// ---------------------------------------------------------------------------
// GET /api/animals
// Query params: status, species, sort (intakeDate_desc | name_asc), cursor, take
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, [
      "RESCUE_LEAD", "INTAKE_SPECIALIST", "FOSTER_PARENT",
      "MEDICAL_OFFICER", "ADOPTION_COUNSELOR",
    ]);

    const { searchParams } = req.nextUrl;
    const status  = searchParams.get("status") as AnimalStatus | null;
    const species = searchParams.get("species");
    const sort    = searchParams.get("sort") ?? "intakeDate_desc";
    const cursor  = searchParams.get("cursor");
    const take    = Math.min(Number(searchParams.get("take") ?? "24"), 100);

    // Build where clause
    type WhereClause = {
      status?: AnimalStatus;
      species?: { equals: string; mode: "insensitive" };
    };
    const where: WhereClause = {};
    if (status && ANIMAL_STATUSES.includes(status)) {
      where.status = status;
    }
    if (species) {
      where.species = { equals: species, mode: "insensitive" };
    }

    // Build orderBy
    const orderBy =
      sort === "name_asc"
        ? { name: "asc" as const }
        : { intakeDate: "desc" as const };

    const animals = await prisma.animal.findMany({
      where,
      orderBy,
      take: take + 1, // fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id:           true,
        name:         true,
        species:      true,
        breed:        true,
        ageYears:     true,
        sex:          true,
        status:       true,
        intakeDate:   true,
        primaryPhoto: true,
      },
    });

    const hasMore = animals.length > take;
    const page    = hasMore ? animals.slice(0, take) : animals;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return NextResponse.json({ animals: page, nextCursor });
  } catch (err) {
    return apiError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/animals
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, ["INTAKE_SPECIALIST", "RESCUE_LEAD"]);

    const body = await req.json();

    // Strip the client-only forceSave flag before validation
    const { forceSave, ...rawData } = body as {
      forceSave?: boolean;
      [key: string]: unknown;
    };

    const parsed = AnimalCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { intakeNotes, ...animalData } = parsed.data;

    // -----------------------------------------------------------------------
    // Duplicate detection: same name + species on the same calendar day
    // -----------------------------------------------------------------------
    if (!forceSave) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const duplicate = await prisma.animal.findFirst({
        where: {
          name: { equals: animalData.name, mode: "insensitive" },
          species: { equals: animalData.species, mode: "insensitive" },
          intakeDate: { gte: todayStart, lte: todayEnd },
        },
        select: { id: true, name: true },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            code: "DUPLICATE_WARNING",
            warning: `An animal named "${duplicate.name}" with the same species was already admitted today. Save anyway?`,
          },
          { status: 409 },
        );
      }
    }

    // -----------------------------------------------------------------------
    // Create animal
    // -----------------------------------------------------------------------
    const animal = await prisma.animal.create({
      data: {
        ...animalData,
        status: "INTAKE",
        intakeDate: new Date(),
        intakeSpecialistId: session.user.id,
        intakeNotes,
      },
    });

    return NextResponse.json(animal, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
