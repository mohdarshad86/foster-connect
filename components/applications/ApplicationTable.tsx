"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import type { ApplicationStatus } from "@prisma/client";

interface ApplicationRow {
  id: string;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  submittedAt: string;
  counselor: { id: string; name: string } | null;
  animal: { id: string; name: string };
}

interface Tab {
  label: string;
  param: string; // value passed to ?status=
}

const TABS: Tab[] = [
  { label: "Active", param: "active" },
  { label: "Submitted", param: "SUBMITTED" },
  { label: "Under Review", param: "UNDER_REVIEW" },
  { label: "Meet & Greet", param: "MEET_GREET_SCHEDULED" },
  { label: "Recommended", param: "RECOMMENDED" },
  { label: "Approved", param: "APPROVED" },
  { label: "Denied", param: "DENIED" },
  { label: "Waitlisted", param: "WAITLISTED" },
  { label: "All", param: "all" },
];

interface Props {
  initialApplications: ApplicationRow[];
  initialTab?: string;
}

export function ApplicationTable({
  initialApplications,
  initialTab = "active",
}: Props) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [applications, setApplications] =
    useState<ApplicationRow[]>(initialApplications);
  const [loading, setLoading] = useState(false);
  const hasMounted = useRef(false);

  const fetchTab = useCallback(async (param: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?status=${param}`);
      if (!res.ok) return;
      const data = (await res.json()) as ApplicationRow[];
      setApplications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip initial fetch — we already have server-rendered data for the default tab
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    fetchTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="bg-white rounded-t-xl border border-slate-200 border-b-0 flex overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.param}
            onClick={() => setActiveTab(tab.param)}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0",
              activeTab === tab.param
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-400 animate-pulse">Loading…</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No applications found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">Applicant</th>
                <th className="text-left px-5 py-3 font-medium">Animal</th>
                <th className="text-left px-5 py-3 font-medium">Submitted</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Counselor</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">
                      {app.applicantName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {app.applicantEmail}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/animals/${app.animal.id}`}
                      className="text-blue-600 hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {app.animal.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {fmt(app.submittedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {app.counselor ? (
                      <span className="text-slate-700">
                        {app.counselor.name}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Unclaimed</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
