"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { LoadingBlock } from "@/components/loading-block";
import { RoleGate } from "@/components/role-gate";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { usePlatformStore } from "@/lib/stores/platform-store";

type UserDraftMap = Record<
  number,
  {
    role: string;
    is_active: boolean;
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
    <AppShell title="Admin workspace for moderation, analytics, and audit visibility." subtitle="Typed control layer over users, jobs, and platform policy">
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
          setMessage("Admin dashboard could not be loaded.");
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
      const userId = user.user_id || user.id;
      if (!userId) {
        return;
      }
      nextUserDrafts[userId] = {
        role: user.db_role || (user.role === "fresher" ? "candidate" : user.role),
        is_active: Boolean(user.is_active),
        verification_status: user.verification_status || "verified"
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
        body: draft
      });
      await refreshDashboard();
      setTone("success");
      setMessage("User settings updated.");
    } catch (_error) {
      setTone("error");
      setMessage("User update failed.");
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
      setMessage("Job moderation updated.");
    } catch (_error) {
      setTone("error");
      setMessage("Job moderation update failed.");
    } finally {
      setSavingJobId(null);
    }
  }

  if (loading && !dashboard) {
    return <LoadingBlock label="Loading admin workspace..." />;
  }

  if (!dashboard) {
    return <Feedback message={message || "Admin dashboard unavailable."} tone="error" />;
  }

  const applicationStatuses =
    typeof dashboard.analytics.application_statuses === "object" && dashboard.analytics.application_statuses
      ? (dashboard.analytics.application_statuses as Record<string, number>)
      : {};

  const analyticsNumber = (key: string) => {
    const value = dashboard.analytics[key];
    return typeof value === "number" ? value : 0;
  };

  return (
    <div className="stack">
      <Feedback message={message} tone={tone} />

      <section className="stats-grid">
        <StatCard label="Users" value={analyticsNumber("users")} hint={`${analyticsNumber("admins")} admins`} />
        <StatCard label="Candidates" value={analyticsNumber("candidates")} hint={`${analyticsNumber("companies")} companies`} />
        <StatCard label="Active jobs" value={analyticsNumber("active_jobs")} hint={`${analyticsNumber("moderated_jobs")} moderated`} />
        <StatCard label="Applications" value={analyticsNumber("applications")} hint={`${analyticsNumber("saved_jobs")} saved jobs`} />
      </section>

      <section className="panel stack">
        <span className="section-label">Application status mix</span>
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
            <span className="section-label">User access</span>
            <h2>Route-level permissions with admin overrides</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Active</th>
                <th>Verification</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dashboard.users.map((user) => {
                const userId = user.user_id || user.id || 0;
                const draft = userDrafts[userId];
                return (
                  <tr key={userId}>
                    <td>
                      <strong>{user.name}</strong>
                      <div className="meta">{user.email}</div>
                    </td>
                    <td>
                      <select
                        value={draft?.role || "candidate"}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [userId]: {
                              ...(current[userId] || { is_active: true, verification_status: "verified" }),
                              role: event.target.value
                            }
                          }))
                        }
                      >
                        <option value="candidate">Candidate</option>
                        <option value="company">Company</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={draft?.is_active ? "true" : "false"}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [userId]: {
                              ...(current[userId] || { role: "candidate", verification_status: "verified" }),
                              is_active: event.target.value === "true"
                            }
                          }))
                        }
                      >
                        <option value="true">Active</option>
                        <option value="false">Disabled</option>
                      </select>
                    </td>
                    <td>
                      {draft?.role === "company" || user.db_role === "company" ? (
                        <select
                          value={draft?.verification_status || "verified"}
                          onChange={(event) =>
                            setUserDrafts((current) => ({
                              ...current,
                              [userId]: {
                                ...(current[userId] || { role: "company", is_active: true }),
                                verification_status: event.target.value
                              }
                            }))
                          }
                        >
                          <option value="verified">Verified</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className="meta">Not company</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn secondary"
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
            <span className="section-label">Job moderation</span>
            <h2>Approve, hold, or reject company listings</h2>
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
                        className="btn secondary"
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
        <span className="section-label">Recent activity</span>
        {!dashboard.recent_activity.length ? <div className="empty">No audit events yet.</div> : null}
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
