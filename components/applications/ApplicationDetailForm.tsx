"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { formatDateTime, formatDateTimeShort } from "@/lib/utils";
import type {
  ApplicationStatus,
  Role,
  Recommendation,
  AlertSeverity,
} from "@prisma/client";

interface Alert {
  id: string;
  severity: AlertSeverity;
  description: string;
}

function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const HOME_CHECK_OPTIONS = [
  { value: "", label: "— Not set —" },
  { value: "Pending", label: "Pending" },
  { value: "Passed", label: "Passed" },
  { value: "Failed", label: "Failed" },
];

const RECOMMENDATION_OPTIONS: Recommendation[] = [
  "APPROVE",
  "DENY",
  "WAITLIST",
];
const DECISION_OPTIONS: Array<"APPROVED" | "DENIED"> = ["APPROVED", "DENIED"];

interface Props {
  application: {
    role: Role;
    id: string;
    status: ApplicationStatus;
    recommendation: Recommendation | null;
    meetGreetAt: string | null;
    decisionNotes: string | null;
    screeningNotes: string | null;
    homeCheckStatus: string | null;
    updatedAt: string;
    counselorId: string | null;
    counselor: { id: string; name: string } | null;
    applicantName: string;
    applicantEmail: string;
    animal: {
      id: string;
      name: string;
      medicalAlerts: Alert[];
    };
  };
}

export function ApplicationDetailForm({ application }: Props) {
  const router = useRouter();

  const isCounselor = application.role === "ADOPTION_COUNSELOR";
  const isLead = application.role === "RESCUE_LEAD";

  const [screeningNotes, setScreeningNotes] = useState(
    application.screeningNotes ?? "",
  );
  const [homeCheckStatus, setHomeCheckStatus] = useState(
    application.homeCheckStatus ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [meetGreetAt, setMeetGreetAt] = useState(
    toDatetimeLocalValue(application.meetGreetAt),
  );
  const [meetGreetSaving, setMeetGreetSaving] = useState(false);
  const [meetGreetError, setMeetGreetError] = useState<string | null>(null);
  const [meetGreetSavedAt, setMeetGreetSavedAt] = useState<string | null>(null);

  const [recommendation, setRecommendation] = useState<Recommendation | "">(
    application.recommendation ?? "",
  );
  const [recommendationSaving, setRecommendationSaving] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );
  const [recommendationSavedAt, setRecommendationSavedAt] = useState<
    string | null
  >(null);

  const [finalDecision, setFinalDecision] = useState<
    "APPROVED" | "DENIED" | ""
  >("");
  const [decisionNotes, setDecisionNotes] = useState(
    application.decisionNotes ?? "",
  );
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSavedAt, setDecisionSavedAt] = useState<string | null>(null);

  const isDirty =
    screeningNotes !== (application.screeningNotes ?? "") ||
    homeCheckStatus !== (application.homeCheckStatus ?? "");

  const formattedMeetGreetAt = application.meetGreetAt
    ? formatDateTime(application.meetGreetAt)
    : null;
  const unresolvedCriticalAlerts = application.animal.medicalAlerts.filter(
    (alert) => alert.severity === "CRITICAL",
  );
  const approveBlocked = unresolvedCriticalAlerts.length > 0;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedAt(null);

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screeningNotes: screeningNotes || null,
          homeCheckStatus: homeCheckStatus || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to save changes.");
        return;
      }

      setSavedAt(new Date().toISOString());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleMeetGreetSave() {
    setMeetGreetSaving(true);
    setMeetGreetError(null);
    setMeetGreetSavedAt(null);

    try {
      const meetGreetIso = meetGreetAt
        ? new Date(meetGreetAt).toISOString()
        : "";
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetGreetAt: meetGreetIso }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setMeetGreetError(json.error ?? "Failed to schedule meet & greet.");
        return;
      }

      setMeetGreetSavedAt(new Date().toISOString());
      router.refresh();
    } finally {
      setMeetGreetSaving(false);
    }
  }

  async function handleRecommendationSave() {
    if (!recommendation) {
      setRecommendationError("Choose a recommendation first.");
      return;
    }

    setRecommendationSaving(true);
    setRecommendationError(null);
    setRecommendationSavedAt(null);

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setRecommendationError(json.error ?? "Failed to save recommendation.");
        return;
      }

      setRecommendationSavedAt(new Date().toISOString());
      router.refresh();
    } finally {
      setRecommendationSaving(false);
    }
  }

  async function handleDecisionSave() {
    if (!finalDecision) {
      setDecisionError("Choose a final decision first.");
      return;
    }

    if (finalDecision === "APPROVED" && approveBlocked) {
      setDecisionError(
        "Resolve unresolved critical medical alerts before approving.",
      );
      return;
    }

    setDecisionSaving(true);
    setDecisionError(null);
    setDecisionSavedAt(null);

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: finalDecision,
          decisionNotes: decisionNotes || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setDecisionError(json.error ?? "Failed to save final decision.");
        return;
      }

      setDecisionSavedAt(new Date().toISOString());
      router.refresh();
    } finally {
      setDecisionSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status + last updated */}
      <div className="flex items-center justify-between">
        <ApplicationStatusBadge status={application.status} />
        <div className="text-right text-xs text-slate-400">
          {application.counselor ? (
            <>
              Last updated {formatDateTimeShort(application.updatedAt)}
              {" · "}
              <span className="text-slate-600 font-medium">
                {application.counselor.name}
              </span>
            </>
          ) : (
            <span className="italic">
              Unclaimed — will be claimed on first save
            </span>
          )}
        </div>
      </div>

      {(isCounselor || isLead) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Schedule Meet &amp; Greet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose a future time for the applicant and foster parent to
                meet.
              </p>
            </div>
            {formattedMeetGreetAt && (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                Scheduled for {formattedMeetGreetAt}
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,18rem)_auto] md:items-end">
            <Input
              label="Meet &amp; Greet time"
              type="datetime-local"
              value={meetGreetAt}
              onChange={(e) => setMeetGreetAt(e.target.value)}
              hint="Native datetime picker, future time only"
            />
            <Button
              size="sm"
              loading={meetGreetSaving}
              disabled={!meetGreetAt}
              onClick={handleMeetGreetSave}
            >
              Confirm
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {meetGreetSavedAt && (
              <p className="text-green-600">
                Saved at {formatDateTimeShort(meetGreetSavedAt)}
              </p>
            )}
            {meetGreetError && <p className="text-red-600">{meetGreetError}</p>}
          </div>
        </div>
      )}

      {isCounselor &&
        (application.status === "MEET_GREET_SCHEDULED" ||
          application.status === "RECOMMENDED") && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Submit Recommendation
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visible once the meet &amp; greet has been scheduled.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700 mb-1">
                Recommendation
              </legend>
              <div className="grid gap-2 md:grid-cols-3">
                {RECOMMENDATION_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                  >
                    <input
                      type="radio"
                      name="recommendation"
                      value={option}
                      checked={recommendation === option}
                      onChange={() => setRecommendation(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                loading={recommendationSaving}
                disabled={!recommendation}
                onClick={handleRecommendationSave}
              >
                Save Recommendation
              </Button>
              {recommendationSavedAt && (
                <p className="text-xs text-green-600">
                  Saved at {formatDateTimeShort(recommendationSavedAt)}
                </p>
              )}
            </div>

            {recommendationError && (
              <p className="text-xs text-red-600">{recommendationError}</p>
            )}
          </div>
        )}

      {isLead && application.status === "RECOMMENDED" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Final Decision
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This closes the application and updates the animal status when
              approved.
            </p>
          </div>

          {approveBlocked && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Approval is blocked until all critical medical alerts are
              resolved.
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700 mb-1">
              Decision
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {DECISION_OPTIONS.map((option) => {
                const blocked = option === "APPROVED" && approveBlocked;
                return (
                  <label
                    key={option}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    title={
                      blocked
                        ? "Resolve unresolved critical medical alerts before approving."
                        : undefined
                    }
                  >
                    <input
                      type="radio"
                      name="finalDecision"
                      value={option}
                      checked={finalDecision === option}
                      onChange={() => setFinalDecision(option)}
                      disabled={blocked}
                    />
                    {option === "APPROVED" ? "Approve" : "Deny"}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Textarea
            label="Decision notes"
            placeholder="Optional notes for the applicant or team…"
            rows={4}
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              loading={decisionSaving}
              disabled={
                !finalDecision ||
                (finalDecision === "APPROVED" && approveBlocked)
              }
              onClick={handleDecisionSave}
            >
              Finalise Adoption
            </Button>
            {decisionSavedAt && (
              <p className="text-xs text-green-600">
                Saved at {formatDateTimeShort(decisionSavedAt)}
              </p>
            )}
          </div>

          {decisionError && (
            <p className="text-xs text-red-600">{decisionError}</p>
          )}
        </div>
      )}

      {/* Screening notes */}
      <Textarea
        label="Screening Notes"
        placeholder="Add notes about your screening conversation, red flags, positive observations…"
        rows={5}
        value={screeningNotes}
        onChange={(e) => setScreeningNotes(e.target.value)}
        hint="Visible to Adoption Counselors and Rescue Lead only"
      />

      {/* Home check status */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          Home Check Status
        </label>
        <select
          value={homeCheckStatus}
          onChange={(e) => setHomeCheckStatus(e.target.value)}
          className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {HOME_CHECK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {homeCheckStatus === "Failed" && (
          <p className="text-xs text-red-600 mt-0.5">
            Saving with a Failed home check will move this application to
            Denied.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          loading={saving}
          disabled={!isDirty}
          onClick={handleSave}
        >
          Save Changes
        </Button>

        {savedAt && (
          <p className="text-xs text-green-600">
            Saved at {formatDateTimeShort(savedAt)}
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
