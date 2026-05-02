import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTimeShort } from "@/lib/utils";
import Link from "next/link";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import { PhotoGallery } from "@/components/animals/PhotoGallery";
import { AssignFosterForm } from "@/components/animals/AssignFosterForm";
import { StatusTransitionPanel } from "@/components/animals/StatusTransitionPanel";
import { AlertBanner } from "@/components/animals/AlertBanner";
import { PlaceAlertForm } from "@/components/animals/PlaceAlertForm";
import {
  AnimalProfileTabs,
  type TabConfig,
} from "@/components/animals/AnimalProfileTabs";
import { NoteTimeline } from "@/components/notes/NoteTimeline";
import { ProgressNoteForm } from "@/components/notes/ProgressNoteForm";
import { PersonalityProfileForm } from "@/components/personality/PersonalityProfileForm";
import { MedicalRecordTabs } from "@/components/medical/MedicalRecordTabs";
import { MedicalRecordForm } from "@/components/medical/MedicalRecordForm";
import { validNextStatuses } from "@/lib/statusMachine";
import { getAnimalStatusLabel } from "@/lib/animalStatus";
import {
  PawPrint,
  ArrowLeft,
  ArrowRight,
  Clock,
  Heart,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { AnimalStatus, MedicalRecord, PersonalityProfile, Role } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

const UPLOAD_ROLES: Role[] = [
  "INTAKE_SPECIALIST",
  "FOSTER_PARENT",
  "RESCUE_LEAD",
];
const HISTORY_ROLES: Role[] = ["RESCUE_LEAD", "INTAKE_SPECIALIST"];
const STAFF_ROLES: Role[] = [
  "RESCUE_LEAD",
  "INTAKE_SPECIALIST",
  "MEDICAL_OFFICER",
  "ADOPTION_COUNSELOR",
];

type RecordWithCreator = MedicalRecord & { createdBy: { name: string } };

export default async function AnimalProfilePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const role = session.user.role as Role;

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      intakeSpecialist: { select: { name: true } },
      fosterParent: { select: { id: true, name: true } },
      medicalAlerts: {
        where: { isResolved: false },
        orderBy: { createdAt: "desc" },
      },
      photos: { orderBy: { uploadedAt: "desc" } },
      personalityProfile: true,
    },
  });

  if (!animal) notFound();

  const isRescueLead = role === "RESCUE_LEAD";
  const isStaff = STAFF_ROLES.includes(role);
  const isOwnerFoster =
    role === "FOSTER_PARENT" && animal.fosterParentId === session.user.id;
  const isNonOwnerFoster = role === "FOSTER_PARENT" && !isOwnerFoster;
  const canPlaceAlert = role === "MEDICAL_OFFICER" || role === "RESCUE_LEAD";

  const showHistory = HISTORY_ROLES.includes(role);
  const showProgressNotes = isOwnerFoster || isStaff;
  const showMedical = role === "MEDICAL_OFFICER" || role === "RESCUE_LEAD";
  const showApplicationsLink =
    role === "ADOPTION_COUNSELOR" || role === "RESCUE_LEAD";

  const canUpload =
    UPLOAD_ROLES.includes(role) && (role !== "FOSTER_PARENT" || isOwnerFoster);

  // Fetch role-gated supplementary data in parallel
  const [fosterParents, historyChangers, activeApplicationsCount, progressNotes, medicalRecords] =
    await Promise.all([
      isRescueLead
        ? prisma.user.findMany({
            where: { role: "FOSTER_PARENT", isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),

      showHistory && animal.statusHistory.length > 0
        ? prisma.user.findMany({
            where: {
              id: {
                in: [
                  ...new Set(animal.statusHistory.map((h) => h.changedById)),
                ],
              },
            },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),

      showApplicationsLink
        ? prisma.adopterApplication.count({
            where: {
              animalId: id,
              status: {
                in: [
                  "SUBMITTED",
                  "UNDER_REVIEW",
                  "MEET_GREET_SCHEDULED",
                  "RECOMMENDED",
                ],
              },
            },
          })
        : Promise.resolve(0),

      showProgressNotes
        ? prisma.progressNote.findMany({
            where:   { animalId: id },
            orderBy: { weekOf: "desc" },
            include: { fosterParent: { select: { name: true } } },
          })
        : Promise.resolve([]),

      showMedical
        ? prisma.medicalRecord.findMany({
            where:   { animalId: id, isVoided: false },
            orderBy: { date: "desc" },
            include: { createdBy: { select: { name: true } } },
          })
        : Promise.resolve([] as RecordWithCreator[]),
    ]);

  const changerMap = new Map(historyChangers.map((u) => [u.id, u.name]));
  const nextStatuses = isRescueLead
    ? validNextStatuses(animal.status as AnimalStatus)
    : [];

  // ── Build role-gated tab list ─────────────────────────────────────────────
  const tabs: TabConfig[] = [];

  // Personality — visible to all roles
  tabs.push({
    id: "personality",
    label: "Personality",
    content: (
      <PersonalityTabContent
        animalId={id}
        profile={animal.personalityProfile}
        canEdit={isOwnerFoster || isRescueLead}
      />
    ),
  });

  // Progress Notes — Foster Parent (own) + all staff
  if (showProgressNotes) {
    tabs.push({
      id: "progress",
      label: "Progress Notes",
      content: (
        <div className="space-y-6">
          {isOwnerFoster && <ProgressNoteForm animalId={id} />}
          <NoteTimeline notes={progressNotes} />
        </div>
      ),
    });
  }

  // Medical Records — Medical Officer + Rescue Lead
  if (showMedical) {
    tabs.push({
      id: "medical",
      label: "Medical Records",
      content: (
        <div className="space-y-6">
          <MedicalRecordForm animalId={id} />
          <MedicalRecordTabs records={medicalRecords as RecordWithCreator[]} />
        </div>
      ),
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/animals"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All animals
      </Link>

      {/* Header — visible to all roles */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center shrink-0">
            {animal.primaryPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/uploads/${animal.primaryPhoto}`}
                alt={animal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <PawPrint className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{animal.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {animal.species}
              {animal.breed ? ` · ${animal.breed}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimalStatusBadge status={animal.status} />
          {canPlaceAlert && <PlaceAlertForm animalId={id} />}
        </div>
      </div>

      {/* Medical alerts — severity-aware, visible to all roles */}
      <AlertBanner
        alerts={animal.medicalAlerts}
        canResolve={canPlaceAlert}
        animalId={id}
      />

      {/* Non-owner Foster Parent: header + alerts only */}
      {isNonOwnerFoster ? (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            You are not the assigned foster parent for this animal. Only public
            information is shown.
          </p>
        </div>
      ) : (
        <>
          {/* Rescue Lead controls */}
          {isRescueLead && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-700">
                Rescue Lead Controls
              </h2>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Assign Foster Parent
                </p>
                <AssignFosterForm
                  animalId={animal.id}
                  currentFosterParentId={animal.fosterParentId}
                  fosterParents={fosterParents}
                />
              </div>

              {nextStatuses.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Advance Status
                  </p>
                  <StatusTransitionPanel
                    animalId={animal.id}
                    validNextStatuses={nextStatuses}
                  />
                </div>
              )}
            </div>
          )}

          {/* Intake details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Intake Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Sex
                </dt>
                <dd className="text-slate-800 mt-0.5">{animal.sex}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Age
                </dt>
                <dd className="text-slate-800 mt-0.5">
                  {animal.ageYears != null
                    ? `${animal.ageYears} yr${animal.ageYears !== 1 ? "s" : ""}`
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Color / Markings
                </dt>
                <dd className="text-slate-800 mt-0.5">
                  {animal.colorMarkings ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Intake Date
                </dt>
                <dd className="text-slate-800 mt-0.5">
                  {formatDate(animal.intakeDate)}
                </dd>
              </div>
              {showHistory && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Intake Specialist
                  </dt>
                  <dd className="text-slate-800 mt-0.5">
                    {animal.intakeSpecialist?.name ?? "—"}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Foster Parent
                </dt>
                <dd className="text-slate-800 mt-0.5">
                  {animal.fosterParent?.name ?? "Not assigned"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status history — Rescue Lead + Intake Specialist only */}
          {showHistory && animal.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Status History
              </h2>
              <ol className="space-y-2">
                {[...animal.statusHistory]
                  .sort(
                    (a, b) =>
                      new Date(b.changedAt).getTime() -
                      new Date(a.changedAt).getTime(),
                  )
                  .map((entry, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">
                          {getAnimalStatusLabel(entry.from)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-800 text-xs">
                          {getAnimalStatusLabel(entry.to)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">
                          {formatDateTimeShort(new Date(entry.changedAt))} ·{" "}
                          {changerMap.get(entry.changedById) ?? "Unknown"}
                        </span>
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {/* Photo gallery */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Photos
            </h2>
            <PhotoGallery
              animalId={animal.id}
              photos={animal.photos}
              primaryPhoto={animal.primaryPhoto}
              canUpload={canUpload}
            />
          </div>

          {/* Applications link — Adoption Counselor + Rescue Lead */}
          {showApplicationsLink && (
            <Link
              href={`/applications?animalId=${animal.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Adoption Applications
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeApplicationsCount > 0
                      ? `${activeApplicationsCount} active application${activeApplicationsCount !== 1 ? "s" : ""}`
                      : "No active applications"}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>
          )}

          {/* Role-gated tabs */}
          <AnimalProfileTabs tabs={tabs} />
        </>
      )}
    </div>
  );
}

// ─── Personality tab ──────────────────────────────────────────────────────

function PersonalityTabContent({
  animalId,
  profile,
  canEdit,
}: {
  animalId: string;
  profile: PersonalityProfile | null;
  canEdit: boolean;
}) {
  if (canEdit) {
    return <PersonalityProfileForm animalId={animalId} profile={profile} />;
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <Heart className="w-8 h-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No personality profile yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
}

