"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { LoadingBlock } from "@/components/loading-block";
import { RoleGate } from "@/components/role-gate";
import { StatusPill } from "@/components/status-pill";
import { apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { usePlatformStore } from "@/lib/stores/platform-store";

type UserDraftMap = Record<
  number,
  {
    verification_status: string;
  }
>;

type JobDraftMap = Record<
  number,
  {
    moderation_status: string;
    is_active: boolean;
  }
>;

export default function AdminPage() {
  return (
    <AppShell>
      <RoleGate roles={["admin"]}>{() => <AdminWorkspace />}</RoleGate>
    </AppShell>
  );
}

function AdminWorkspace() {
  const dashboard = usePlatformStore((state) => state.adminDashboard);
  const loadAdminDashboard = usePlatformStore((state) => state.loadAdminDashboard);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [loading, setLoading] = useState(true);
  const [userDrafts, setUserDrafts] = useState<UserDraftMap>({});
  const [jobDrafts, setJobDrafts] = useState<JobDraftMap>({});
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [savingJobId, setSavingJobId] = useState<number | null>(null);

  async function refreshDashboard() {
    return loadAdminDashboard();
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await refreshDashboard();
      } catch (_error) {
        if (active) {
          setTone("error");
          setMessage("We couldn't open the governance console right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const nextUserDrafts: UserDraftMap = {};
    dashboard.users.forEach((user) => {
      if ((user.db_role || user.role) !== "company") {
        return;
      }
      const userId = user.user_id || user.id;
      if (!userId) {
        return;
      }
      nextUserDrafts[userId] = {
        verification_status: user.verification_status || "pending"
      };
    });

    const nextJobDrafts: JobDraftMap = {};
    dashboard.jobs.forEach((job) => {
      nextJobDrafts[job.id] = {
        moderation_status: job.moderation_status || "approved",
        is_active: Boolean(job.is_active)
      };
    });

    setUserDrafts(nextUserDrafts);
    setJobDrafts(nextJobDrafts);
  }, [dashboard]);

  async function handleSaveUser(userId: number) {
    const draft = userDrafts[userId];
    if (!draft) {
      return;
    }
    setSavingUserId(userId);
    setMessage("");

    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: { verification_status: draft.verification_status }
      });
      await refreshDashboard();
      setTone("success");
      setMessage("Employer verification status updated successfully.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't update that employer verification status.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleSaveJob(jobId: number) {
    const draft = jobDrafts[jobId];
    if (!draft) {
      return;
    }
    setSavingJobId(jobId);
    setMessage("");

    try {
      await apiRequest(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        body: draft
      });
      await refreshDashboard();
      setTone("success");
      setMessage("Opportunity moderation status updated successfully.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't update that opportunity moderation status.");
    } finally {
      setSavingJobId(null);
    }
  }

  if (loading && !dashboard) {
    return <LoadingBlock label="Loading the governance console..." />;
  }

  if (!dashboard) {
    return <Feedback message={message || "The governance console is currently unavailable."} tone="error" />;
  }

  const applicationStatuses =
    typeof dashboard.analytics.application_statuses === "object" && dashboard.analytics.application_statuses
      ? (dashboard.analytics.application_statuses as Record<string, number>)
      : {};

  const analyticsNumber = (key: string) => {
    const value = dashboard.analytics[key];
    return typeof value === "number" ? value : 0;
  };
  const companies = dashboard.users.filter((user) => (user.db_role || user.role) === "company");

  return (
    <div className="stack">
      <Feedback message={message} tone={tone} />

      <section className="panel dashboard-hero-panel">
        <div className="dashboard-hero-grid">
          <div className="page-intro">
            <span className="section-label">Governance Console</span>
            <h1 className="page-title">Protect marketplace quality with fast, accountable decisions.</h1>
            <p className="muted">Oversee employer verification, opportunity moderation, and platform activity from one professional control center.</p>
          </div>
          <div className="hero-mini-grid">
            <div className="mini-stat">
              <span>Total accounts</span>
              <strong>{analyticsNumber("users")}</strong>
            </div>
            <div className="mini-stat">
              <span>Active listings</span>
              <strong>{analyticsNumber("active_jobs")}</strong>
            </div>
            <div className="mini-stat">
              <span>Total applications</span>
              <strong>{analyticsNumber("applications")}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <span className="section-label">Application Health Snapshot</span>
        <div className="tag-list">
          {Object.entries(applicationStatuses).map(([key, value]) => (
            <span className="tag" key={key}>
              {key}: {value}
            </span>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div className="row">
          <div className="stack">
            <span className="section-label">Employer Verification</span>
            <h2>Approve, hold, or decline employer access requests</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Profile</th>
                <th>Verification</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((user) => {
                const userId = user.user_id || user.id || 0;
                const draft = userDrafts[userId];
                return (
                  <tr key={userId}>
                    <td>
                      <strong>{user.company_name || user.name}</strong>
                      <div className="meta">{user.location || "-"}</div>
                    </td>
                    <td>
                      <strong>{user.name}</strong>
                      <div className="meta">{user.email}</div>
                    </td>
                    <td>
                      <div className="meta">Created {formatDateTime(user.created_at)}</div>
                      <div className="meta">Completion {user.profile_completion || 0}%</div>
                      <div className="meta">{user.company_website || "-"}</div>
                    </td>
                    <td>
                      <select
                        value={draft?.verification_status || "pending"}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [userId]: {
                              verification_status: event.target.value
                            }
                          }))
                        }
                      >
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn secondary compact-btn"
                        type="button"
                        disabled={savingUserId === userId}
                        onClick={() => void handleSaveUser(userId)}
                      >
                        {savingUserId === userId ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <div className="row">
          <div className="stack">
            <span className="section-label">Opportunity Moderation</span>
            <h2>Control which roles become visible to candidates</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Moderation</th>
                <th>Visibility</th>
                <th>Applicants</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dashboard.jobs.map((job) => {
                const draft = jobDrafts[job.id];
                return (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.title}</strong>
                      <div className="meta">{job.company_name}</div>
                    </td>
                    <td>
                      <select
                        value={draft?.moderation_status || "approved"}
                        onChange={(event) =>
                          setJobDrafts((current) => ({
                            ...current,
                            [job.id]: {
                              ...(current[job.id] || { is_active: true }),
                              moderation_status: event.target.value
                            }
                          }))
                        }
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={draft?.is_active ? "true" : "false"}
                        onChange={(event) =>
                          setJobDrafts((current) => ({
                            ...current,
                            [job.id]: {
                              ...(current[job.id] || { moderation_status: "approved" }),
                              is_active: event.target.value === "true"
                            }
                          }))
                        }
                      >
                        <option value="true">Active</option>
                        <option value="false">Hidden</option>
                      </select>
                    </td>
                    <td>{job.application_count || 0}</td>
                    <td>
                      <button
                        className="btn secondary compact-btn"
                        type="button"
                        disabled={savingJobId === job.id}
                        onClick={() => void handleSaveJob(job.id)}
                      >
                        {savingJobId === job.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <span className="section-label">Audit Trail</span>
        {!dashboard.recent_activity.length ? <div className="empty">Recent governance actions will appear here as the platform evolves.</div> : null}
        <div className="list">
          {dashboard.recent_activity.map((event) => (
            <article className="activity-card stack" key={event.id}>
              <div className="row">
                <strong>{event.summary}</strong>
                <StatusPill value={event.status} />
              </div>
              <div className="meta">
                {event.actor_name || "System"} | {formatDateTime(event.created_at)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
