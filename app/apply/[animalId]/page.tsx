import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApplicationForm } from "@/components/apply/ApplicationForm";
import { CopyLinkButton } from "@/components/apply/CopyLinkButton";
import { formatDuration } from "@/lib/utils";
import { PawPrint, Clock } from "lucide-react";

const objectIdPattern = /^[a-f0-9]{24}$/i;

interface Props {
  params: Promise<{ animalId: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { animalId } = await params;

  if (!objectIdPattern.test(animalId)) {
    notFound();
  }

  let animal;

  try {
    animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: {
        id:           true,
        name:         true,
        species:      true,
        breed:        true,
        status:       true,
        primaryPhoto: true,
        intakeDate:   true,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2023") {
      notFound();
    }

    throw error;
  }

  if (!animal) notFound();

  const isAvailable = animal.status === "ADOPTION_READY";
  const timeInCare  = formatDuration(animal.intakeDate);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Brand mark */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-lg">
            <PawPrint className="w-6 h-6" />
            Foster Connect
          </div>
        </div>

        {/* Animal card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {animal.primaryPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/uploads/${animal.primaryPhoto}`}
              alt={animal.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-blue-50 flex items-center justify-center">
              <PawPrint className="w-16 h-16 text-blue-200" />
            </div>
          )}

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{animal.name}</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {animal.species}
                  {animal.breed ? ` · ${animal.breed}` : ""}
                </p>
                {/* Story 33 — time in foster care */}
                {timeInCare && (
                  <p className="flex items-center gap-1 text-xs text-slate-400 mt-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    In care for {timeInCare}
                  </p>
                )}
              </div>
              {/* Story 23 — share link button */}
              <CopyLinkButton />
            </div>
          </div>
        </div>

        {/* Not available notice */}
        {!isAvailable ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 text-center space-y-2">
            <p className="text-base font-semibold text-slate-800">
              {animal.name} is not currently available for adoption.
            </p>
            <p className="text-sm text-slate-500">
              Only animals marked <strong>Adoption Ready</strong> can accept
              applications. Please check back later.
            </p>
          </div>
        ) : (
          /* Application form */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Apply to adopt {animal.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Fill in the details below and we&apos;ll be in touch to discuss
                next steps.
              </p>
            </div>

            <ApplicationForm animalId={animal.id} />
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Foster Connect · All rights reserved
        </p>
      </div>
    </div>
  );
}
