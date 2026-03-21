"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { LoadingBlock } from "@/components/loading-block";
import { RoleGate } from "@/components/role-gate";
import { StatusPill } from "@/components/status-pill";
import { apiRequest } from "@/lib/api";
import { formatDate, formatDateTime, normalizeStatusLabel, toCommaList } from "@/lib/format";
import { dashboardPath, jobPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { Application, SessionUser } from "@/lib/types";

const workflowStatuses = ["applied", "reviewing", "shortlisted", "interview", "offered", "rejected"];

export default function ApplicationDetailPage() {
  return (
    <AppShell>
      <RoleGate roles={["fresher", "company"]}>{(user) => <ApplicationWorkspace user={user} />}</RoleGate>
    </AppShell>
  );
}

function ApplicationWorkspace({ user }: { user: SessionUser }) {
  const params = useParams<{ id: string }>();
  const loadCompanyDashboard = usePlatformStore((state) => state.loadCompanyDashboard);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApplication() {
      try {
        let resolved: Application | null = null;

        if (user.role === "company") {
          const dashboard = await loadCompanyDashboard();
          resolved =
            dashboard.applications.find((item) => String(item.id) === String(params.id)) || null;
        } else {
          const response = await apiRequest<{ ok: boolean; applications: Application[] }>("/api/applications/me");
          resolved = response.applications.find((item) => String(item.id) === String(params.id)) || null;
        }

        if (active) {
          setApplication(resolved);
          if (!resolved) {
            setMessage("We couldn't find this application in your current workspace.");
          }
        }
      } catch (_error) {
        if (active) {
          setMessage("We couldn't load this application timeline right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadApplication();
    return () => {
      active = false;
    };
  }, [loadCompanyDashboard, params.id, user.role]);

  if (loading) {
    return <LoadingBlock label="Loading your application timeline..." />;
  }

  if (!application) {
    return <Feedback message={message || "This application is not available right now."} tone="error" />;
  }

  return (
    <div className="stack">
      <section className="hero">
        <section className="panel stack">
          <div className="row">
            <div className="stack">
              <span className="section-label">{application.job.company_name}</span>
              <h2>{application.job.title}</h2>
            </div>
            <StatusPill value={application.status} />
          </div>
          <div className="button-row">
            <Link href={dashboardPath(user.role)} className="btn secondary">
              Back to Workspace
            </Link>
            <Link href={jobPath(application.job.id)} className="btn secondary">
              View Opportunity
            </Link>
          </div>
          <div className="detail-list">
            <div className="detail-item">
              <span>Applied</span>
              <strong>{formatDate(application.applied_at)}</strong>
            </div>
            <div className="detail-item">
              <span>Decision deadline</span>
              <strong>{formatDate(application.decision_deadline)}</strong>
            </div>
            <div className="detail-item">
              <span>Interview</span>
              <strong>{formatDateTime(application.interview_at)}</strong>
            </div>
            <div className="detail-item">
              <span>Decision reason</span>
              <strong>{application.decision_reason || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="hero-card stack">
          <span className="section-label">Application Timeline</span>
          <div className="timeline">
            {workflowStatuses.map((status) => {
              const currentIndex = workflowStatuses.indexOf(application.status);
              const itemIndex = workflowStatuses.indexOf(status);
              const stateClass =
                application.status === "rejected" && status !== "rejected"
                  ? itemIndex <= workflowStatuses.indexOf("interview")
                    ? "done"
                    : ""
                  : itemIndex < currentIndex
                    ? "done"
                    : itemIndex === currentIndex
                      ? "current"
                      : "";

              return (
                <div className={`timeline-item ${stateClass}`.trim()} key={status}>
                  <span className="timeline-dot" />
                  <span>{normalizeStatusLabel(status)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <section className="detail-grid">
        {user.role === "company" ? (
          <section className="panel stack">
            <span className="section-label">Candidate Snapshot</span>
            <div className="detail-list">
              <div className="detail-item">
                <span>Name</span>
                <strong>{application.candidate?.name || "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Email</span>
                <strong>{application.candidate?.email || "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Education</span>
                <strong>{application.candidate?.education || "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Skills</span>
                <strong>{toCommaList(application.candidate?.skills)}</strong>
              </div>
            </div>
          </section>
        ) : null}

        <section className="panel stack">
          <span className="section-label">Opportunity Context</span>
          <div className="detail-list">
            <div className="detail-item">
              <span>Location</span>
              <strong>{application.job.location || "Location flexible"}</strong>
            </div>
            <div className="detail-item">
              <span>Mode</span>
              <strong>{application.job.work_mode || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Skills</span>
              <strong>{toCommaList(application.job.required_skills)}</strong>
            </div>
            <div className="detail-item">
              <span>Hiring stages</span>
              <strong>{toCommaList(application.job.hiring_stages)}</strong>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
