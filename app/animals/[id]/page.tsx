import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAnimalTagline } from "@/lib/utils";
import { CopyLinkButton } from "@/components/apply/CopyLinkButton";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";
import { PawPrint, ArrowLeft, ShieldCheck } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

const objectIdPattern = /^[a-f0-9]{24}$/i;
const PUBLIC_STATUSES = ["ADOPTION_READY", "PENDING_ADOPTION"] as const;
const DEFAULT_HEALTH = "Up to date with routine vet care";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!objectIdPattern.test(id)) return {};

  try {
    const animal = await prisma.animal.findUnique({
      where: { id },
      select: { name: true, publicBio: true, status: true },
    });

    if (
      !animal ||
      !PUBLIC_STATUSES.includes(
        animal.status as (typeof PUBLIC_STATUSES)[number],
      )
    ) {
      return {};
    }

    const description = animal.publicBio
      ? animal.publicBio.slice(0, 160)
      : `${animal.name} is looking for a loving home. Apply to adopt through Foster Connect.`;

    return {
      title: `${animal.name} — Available for Adoption | Foster Connect`,
      description,
      openGraph: {
        title: `${animal.name} — Available for Adoption`,
        description,
        type: "website",
      },
    };
  } catch {
    return {};
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicAnimalProfilePage({ params }: Props) {
  const { id } = await params;

  if (!objectIdPattern.test(id)) notFound();

  let animal;
  try {
    animal = await prisma.animal.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        ageYears: true,
        sex: true,
        colorMarkings: true,
        status: true,
        primaryPhoto: true,
        publicBio: true,
        healthSummary: true,
        photos: {
          select: { id: true, filePath: true, caption: true },
          orderBy: { uploadedAt: "desc" },
        },
        personalityProfile: {
          select: {
            traits: true,
            goodWithKids: true,
            goodWithDogs: true,
            energyLevel: true,
          },
        },
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2023") notFound();
    throw err;
  }

  if (!animal) notFound();
  if (
    !PUBLIC_STATUSES.includes(animal.status as (typeof PUBLIC_STATUSES)[number])
  )
    notFound();

  const tagline = getAnimalTagline(animal.personalityProfile);
  const traits = animal.personalityProfile?.traits ?? [];
  const isPending = animal.status === "PENDING_ADOPTION";

  // Secondary photos excluding the primary
  const secondaryPhotos = animal.photos.filter(
    (p) => p.filePath !== animal.primaryPhoto,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-600 font-semibold"
          >
            <PawPrint className="w-5 h-5" />
            <span className="text-slate-900">Foster Connect</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/faq"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 sm:px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all animals
        </Link>
      </div>

      {/* ── Hero card — photo + identity side-by-side ──────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Photo */}
            <div className="relative bg-blue-50 flex items-center justify-center" style={{ minHeight: "280px", maxHeight: "340px" }}>
              {animal.primaryPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/uploads/${animal.primaryPhoto}`}
                  alt={animal.name}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: "340px" }}
                />
              ) : (
                <PawPrint className="w-20 h-20 text-blue-200" />
              )}
            </div>

            {/* Identity + CTA */}
            <div className="p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                {/* Name + tagline */}
                <div>
                  <p className="text-sm italic text-slate-400 mb-1">{tagline}</p>
                  <h1 className="text-2xl font-bold text-slate-900">{animal.name}</h1>

                  {/* Quick facts */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-sm text-slate-500">
                    <span>{animal.species}</span>
                    {animal.breed && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>{animal.breed}</span>
                      </>
                    )}
                    {animal.ageYears != null && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>
                          {animal.ageYears} yr{animal.ageYears !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                    <span className="text-slate-300">·</span>
                    <span>{animal.sex}</span>
                    {animal.colorMarkings && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>{animal.colorMarkings}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Health summary badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {animal.healthSummary ?? DEFAULT_HEALTH}
                </span>

                {/* Trait pills */}
                {traits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {traits.map((trait) => (
                      <span
                        key={trait}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-2">
                {isPending ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                      <PawPrint className="w-4 h-4 shrink-0" />
                      <span>Applications are paused — adoption in progress.</span>
                    </div>
                    <Link
                      href="/application-status"
                      className="block w-full text-center px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Check application status
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/apply/${animal.id}`}
                      className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Apply to Adopt {animal.name}
                    </Link>
                    <p className="text-xs text-center text-slate-400">
                      Free · No account required
                    </p>
                  </>
                )}

                <div className="flex justify-center pt-1">
                  <CopyLinkButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bio + More photos ──────────────────────────────────────────────── */}
      {(animal.publicBio || secondaryPhotos.length > 0) && (
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
          {/* Public bio */}
          {animal.publicBio && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">
                About {animal.name}
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {animal.publicBio}
              </p>
            </div>
          )}

          {/* Secondary photo thumbnail strip */}
          {secondaryPhotos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                More photos
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {secondaryPhotos.slice(0, 12).map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${photo.filePath}`}
                      alt={photo.caption ?? `Photo of ${animal.name}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── How Adoption Works — shared from lib/constants ─────────────────── */}
      <section className="bg-white border-t border-slate-200 mt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            How Adoption Works
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link
              href="/faq"
              className="text-sm text-blue-600 hover:underline"
            >
              Have questions? Read our FAQ →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
