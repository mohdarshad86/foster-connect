import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Heart, User, MapPin, Phone, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ApplicationDetailForm } from "@/components/applications/ApplicationDetailForm";
import type { Role } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  if (role !== "ADOPTION_COUNSELOR" && role !== "RESCUE_LEAD") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const application = await prisma.adopterApplication.findUnique({
    where: { id },
    include: {
      counselor: { select: { id: true, name: true } },
      animal: {
        include: {
          personalityProfile: true,
          photos: { take: 1, orderBy: { uploadedAt: "desc" } },
          medicalAlerts: {
            where: { isResolved: false },
            select: { id: true, severity: true, description: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!application) notFound();

  const { animal } = application;
  const profile = animal.personalityProfile;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All applications
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {application.applicantName}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Applied for{" "}
          <Link
            href={`/animals/${animal.id}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {animal.name}
          </Link>
          {" · "}Submitted {formatDate(application.submittedAt)}
        </p>
      </div>

      {/* Applicant contact info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          Applicant Information
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </dt>
            <dd className="text-slate-800 mt-0.5">
              <a
                href={`mailto:${application.applicantEmail}`}
                className="text-blue-600 hover:underline"
              >
                {application.applicantEmail}
              </a>
            </dd>
          </div>

          {application.applicantPhone && (
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </dt>
              <dd className="text-slate-800 mt-0.5">
                {application.applicantPhone}
              </dd>
            </div>
          )}

          {application.applicantAddress && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Address
              </dt>
              <dd className="text-slate-800 mt-0.5">
                {application.applicantAddress}
              </dd>
            </div>
          )}

          {application.householdNotes && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Household Notes
              </dt>
              <dd className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {application.householdNotes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Animal personality profile — read-only */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-slate-400" />
          {animal.name}&apos;s Personality
        </h2>

        {!profile ? (
          <p className="text-sm text-slate-400 italic">
            No personality profile on file yet.
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Energy Level
              </dt>
              <dd className="text-slate-800 mt-0.5">
                {profile.energyLevel ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Good with Kids
              </dt>
              <dd className="text-slate-800 mt-0.5">
                {profile.goodWithKids === null
                  ? "Unknown"
                  : profile.goodWithKids
                    ? "Yes"
                    : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Good with Dogs
              </dt>
              <dd className="text-slate-800 mt-0.5">
                {profile.goodWithDogs === null
                  ? "Unknown"
                  : profile.goodWithDogs
                    ? "Yes"
                    : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Good with Cats
              </dt>
              <dd className="text-slate-800 mt-0.5">
                {profile.goodWithCats === null
                  ? "Unknown"
                  : profile.goodWithCats
                    ? "Yes"
                    : "No"}
              </dd>
            </div>
            {profile.traits.length > 0 && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                  Traits
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {profile.traits.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {profile.idealHome && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Ideal Home
                </dt>
                <dd className="text-slate-800 mt-0.5">{profile.idealHome}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Screening panel — editable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-5">Screening</h2>
        <ApplicationDetailForm
          application={{
            role,
            id: application.id,
            status: application.status,
            recommendation: application.recommendation,
            meetGreetAt: application.meetGreetAt?.toISOString() ?? null,
            decisionNotes: application.decisionNotes,
            screeningNotes: application.screeningNotes,
            homeCheckStatus: application.homeCheckStatus,
            updatedAt: application.updatedAt.toISOString(),
            counselorId: application.counselorId,
            counselor: application.counselor,
            applicantName: application.applicantName,
            applicantEmail: application.applicantEmail,
            animal: {
              id: animal.id,
              name: animal.name,
              medicalAlerts: animal.medicalAlerts,
            },
          }}
        />
      </div>
    </div>
  );
}
