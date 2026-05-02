import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError } from "@/lib/permissions";
import { AnimalCreateSchema } from "@/lib/validators/animal";

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // intakeNotes stored once prisma generate + db push has been run:
        intakeNotes,
      },
    });

    return NextResponse.json(animal, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
