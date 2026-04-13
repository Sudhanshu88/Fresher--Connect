"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { LoadingBlock } from "@/components/loading-block";
import { RoleGate } from "@/components/role-gate";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { apiRequest } from "@/lib/api";
import { compactUrl, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { applicationPath, jobPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

const defaultJobForm = {
  title: "",
  description: "",
  experience_required: "",
  education_required: "",
  employment_type: "full-time",
  work_mode: "onsite",
  department: "",
  skills: "",
  location: "",
  salary_range: "",
  role_overview: "",
  benefits: "",
  hiring_stages: "Applied, Under review, Interview, Offered"
};

type ApplicationDraftMap = Record<
  number,
  {
    status: string;
    interview_at: string;
    decision_reason: string;
  }
>;

export default function CompanyPage() {
  return (
    <AppShell>
      <RoleGate roles={["company"]}>
        <CompanyWorkspace />
      </RoleGate>
    </AppShell>
  );
}

function CompanyWorkspace() {
  const dashboard = usePlatformStore((state) => state.companyDashboard);
  const loadCompanyDashboard = usePlatformStore((state) => state.loadCompanyDashboard);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [loading, setLoading] = useState(true);
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [applicationDrafts, setApplicationDrafts] = useState<ApplicationDraftMap>({});
  const [updatingApplicationId, setUpdatingApplicationId] = useState<number | null>(null);

  const refreshDashboard = useCallback(() => loadCompanyDashboard(), [loadCompanyDashboard]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await refreshDashboard();
      } catch (_error) {
        if (active) {
          setTone("error");
          setMessage("We couldn't open your hiring workspace right now.");
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
  }, [refreshDashboard]);

  useEffect(() => {
    if (!dashboard?.applications) {
      return;
    }
    const nextDrafts: ApplicationDraftMap = {};
    dashboard.applications.forEach((application) => {
      nextDrafts[application.id] = {
        status: application.status,
        interview_at: application.interview_at
          ? String(application.interview_at).replace("Z", "").slice(0, 16)
          : "",
        decision_reason: application.decision_reason || ""
      };
    });
    setApplicationDrafts(nextDrafts);
  }, [dashboard?.applications]);

  async function handleLogoUpload() {
    if (!logoFile) {
      setTone("error");
      setMessage("Please choose a logo file before uploading.");
      return;
    }

    setUploadingLogo(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);
      await apiRequest("/api/company/logo", {
        method: "POST",
        body: formData
      });
      await refreshDashboard();
      setLogoFile(null);
      setTone("success");
      setMessage("Your company logo has been updated successfully.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't upload the company logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingJob(true);
    setMessage("");

    try {
      await apiRequest("/api/company/jobs", {
        method: "POST",
        body: {
          title: jobForm.title,
          description: jobForm.description,
          experience_required: jobForm.experience_required,
          education_required: jobForm.education_required,
          employment_type: jobForm.employment_type,
          work_mode: jobForm.work_mode,
          department: jobForm.department,
          skills: jobForm.skills,
          location: jobForm.location,
          salary_range: jobForm.salary_range,
          role_overview: jobForm.role_overview,
          benefits: jobForm.benefits,
          hiring_stages: jobForm.hiring_stages
        }
      });
      await refreshDashboard();
      setJobForm(defaultJobForm);
      setTone("success");
      setMessage("Your opportunity is live and ready for candidate discovery.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't publish this opportunity. Please review the required details and try again.");
    } finally {
      setSubmittingJob(false);
    }
  }

  async function handleUpdateApplication(applicationId: number) {
    const draft = applicationDrafts[applicationId];
    if (!draft) {
      return;
    }

    setUpdatingApplicationId(applicationId);
    setMessage("");
    try {
      await apiRequest(`/api/company/applications/${applicationId}`, {
        method: "PATCH",
        body: {
          status: draft.status,
          interview_at: draft.interview_at ? new Date(draft.interview_at).toISOString() : "",
          decision_reason: draft.decision_reason
        }
      });
      await refreshDashboard();
      setTone("success");
      setMessage("Candidate stage updated successfully.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't update that candidate stage. Please try again.");
    } finally {
      setUpdatingApplicationId(null);
    }
  }

  if (loading && !dashboard) {
    return <LoadingBlock label="Loading your hiring workspace..." />;
  }

  if (!dashboard) {
    return <Feedback message={message || "Your hiring workspace is currently unavailable."} tone="error" />;
  }

  return (
    <div className="stack">
      <Feedback message={message} tone={tone} />

      <section className="panel dashboard-hero-panel">
        <div className="dashboard-hero-grid">
          <div className="page-intro">
            <span className="section-label">Hiring Workspace</span>
            <h1 className="page-title">Move from open role to accepted offer with more control.</h1>
            <p className="muted">Employer branding, opportunity publishing, pipeline updates, and analytics stay connected in one decision-ready workspace.</p>
          </div>
          <div className="hero-mini-grid">
            <div className="mini-stat">
              <span>Open roles</span>
              <strong>{dashboard.analytics.open_jobs}</strong>
            </div>
            <div className="mini-stat">
              <span>Applicants</span>
              <strong>{dashboard.analytics.total_applicants}</strong>
            </div>
            <div className="mini-stat">
              <span>Decision rate</span>
              <strong>{formatPercent(dashboard.analytics.decision_rate)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <section className="panel stack">
          <div className="row">
            <div className="stack">
              <span className="section-label">Employer Profile</span>
              <h2>{dashboard.user.company_name || dashboard.user.name}</h2>
            </div>
            <StatusPill value={dashboard.user.verification_status || "verified"} />
          </div>
          <div className="detail-list">
            <div className="detail-item">
              <span>Contact</span>
              <strong>{dashboard.user.name}</strong>
            </div>
            <div className="detail-item">
              <span>Email</span>
              <strong>{dashboard.user.email}</strong>
            </div>
            <div className="detail-item">
              <span>Website</span>
              <strong>{compactUrl(dashboard.user.company_website)}</strong>
            </div>
            <div className="detail-item">
              <span>Industry</span>
              <strong>{dashboard.user.industry_type || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Size</span>
              <strong>{dashboard.user.company_size || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Description</span>
              <strong>{dashboard.user.company_description || "-"}</strong>
            </div>
          </div>
          <div className="field">
            <span>Employer Brand Logo</span>
            <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.svg" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} />
            <button className="btn secondary" type="button" disabled={uploadingLogo} onClick={() => void handleLogoUpload()}>
              {uploadingLogo ? "Uploading logo..." : "Upload Logo"}
            </button>
          </div>
        </section>

        <section className="panel stack">
          <span className="section-label">Performance Snapshot</span>
          <div className="stats-grid compact-grid">
            <StatCard label="Shortlisted" value={formatPercent(dashboard.analytics.shortlisted_rate)} />
            <StatCard label="Interviewed" value={formatPercent(dashboard.analytics.interview_rate)} />
            <StatCard label="Offers" value={formatPercent(dashboard.analytics.offer_rate)} />
            <StatCard label="Average decision" value={`${dashboard.analytics.avg_decision_hours}h`} />
          </div>
          <div className="detail-list">
            {Object.entries(dashboard.status_counts).map(([key, value]) => (
              <div className="detail-item" key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="panel stack">
        <div className="row">
          <div className="stack">
            <span className="section-label">Create Opportunity</span>
            <h2>Publish a new role with a professional candidate experience</h2>
          </div>
        </div>
        <form className="form" onSubmit={handleCreateJob}>
          <div className="two-col">
            <label className="field">
              <span>Role Title</span>
              <input value={jobForm.title} onChange={(event) => setJobForm((current) => ({ ...current, title: event.target.value }))} placeholder="Graduate Software Engineer" required />
            </label>
            <label className="field">
              <span>Department</span>
              <input value={jobForm.department} onChange={(event) => setJobForm((current) => ({ ...current, department: event.target.value }))} placeholder="Engineering, Analytics, Operations" required />
            </label>
          </div>
          <label className="field">
            <span>Role Description</span>
            <textarea value={jobForm.description} onChange={(event) => setJobForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the opportunity, outcomes, and what success looks like in the role." required />
          </label>
          <div className="two-col">
            <label className="field">
              <span>Experience Requirement</span>
              <input value={jobForm.experience_required} onChange={(event) => setJobForm((current) => ({ ...current, experience_required: event.target.value }))} placeholder="Fresher, internship, 0-1 year" required />
            </label>
            <label className="field">
              <span>Education Requirement</span>
              <input value={jobForm.education_required} onChange={(event) => setJobForm((current) => ({ ...current, education_required: event.target.value }))} placeholder="B.Tech, BCA, Any Graduate" required />
            </label>
          </div>
          <div className="two-col">
            <label className="field">
              <span>Employment Type</span>
              <input value={jobForm.employment_type} onChange={(event) => setJobForm((current) => ({ ...current, employment_type: event.target.value }))} required />
            </label>
            <label className="field">
              <span>Work Model</span>
              <select value={jobForm.work_mode} onChange={(event) => setJobForm((current) => ({ ...current, work_mode: event.target.value }))}>
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
          <div className="two-col">
            <label className="field">
              <span>Key Skills</span>
              <input value={jobForm.skills} onChange={(event) => setJobForm((current) => ({ ...current, skills: event.target.value }))} placeholder="React, SQL, Communication" required />
            </label>
            <label className="field">
              <span>Location</span>
              <input value={jobForm.location} onChange={(event) => setJobForm((current) => ({ ...current, location: event.target.value }))} placeholder="Bengaluru, Remote, Hyderabad" />
            </label>
          </div>
          <div className="two-col">
            <label className="field">
              <span>Compensation Range</span>
              <input value={jobForm.salary_range} onChange={(event) => setJobForm((current) => ({ ...current, salary_range: event.target.value }))} placeholder="3,00,000 - 5,00,000" />
            </label>
            <label className="field">
              <span>Hiring Stages</span>
              <input value={jobForm.hiring_stages} onChange={(event) => setJobForm((current) => ({ ...current, hiring_stages: event.target.value }))} />
            </label>
          </div>
          <label className="field">
            <span>Role Overview</span>
            <textarea value={jobForm.role_overview} onChange={(event) => setJobForm((current) => ({ ...current, role_overview: event.target.value }))} placeholder="Summarize the opportunity, expected impact, and team environment." />
          </label>
          <label className="field">
            <span>Benefits and Perks</span>
            <textarea value={jobForm.benefits} onChange={(event) => setJobForm((current) => ({ ...current, benefits: event.target.value }))} placeholder="Highlight growth support, learning budgets, flexibility, or other benefits." />
          </label>
          <button className="btn primary" type="submit" disabled={submittingJob}>
            {submittingJob ? "Publishing..." : "Publish Opportunity"}
          </button>
        </form>
      </section>

      <section className="detail-grid">
        <section className="panel stack">
          <span className="section-label">Live Opportunities</span>
          {!dashboard.posted_jobs.length ? <div className="empty">No opportunities have been published yet.</div> : null}
          <div className="list">
            {dashboard.posted_jobs.map((job) => (
              <article className="activity-card stack" key={job.id}>
                <div className="row">
                  <strong>{job.title}</strong>
                  <StatusPill value={job.moderation_status} />
                </div>
                <div className="meta">
                  {job.location || "Location flexible"} | {job.work_mode || "-"} | {job.application_count || 0} applicants
                </div>
                <div className="row">
                  <span className="helper">Posted {formatDate(job.posted_date || job.created_at)}</span>
                  <Link href={jobPath(job.id)} className="btn secondary">
                    View Opportunity
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <span className="section-label">Top Performers</span>
          {!dashboard.analytics.top_jobs.length ? <div className="empty">Performance insights will appear after your roles start receiving applicants.</div> : null}
          <div className="list">
            {dashboard.analytics.top_jobs.map((job) => (
              <article className="activity-card stack" key={job.job_id}>
                <div className="row">
                  <strong>{job.title}</strong>
                  <span className="pill">{job.application_count} applicants</span>
                </div>
                <div className="meta">
                  Shortlisted {job.shortlisted_count} | Interview {job.interview_count} | Offer {job.offer_count}
                </div>
                <span className="helper">Decision rate {formatPercent(job.decision_rate)}</span>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="panel stack">
        <div className="row">
          <div className="stack">
            <span className="section-label">Candidate Pipeline</span>
            <h2>Advance talent with speed, clarity, and stronger communication</h2>
          </div>
        </div>
        {!dashboard.applications.length ? <div className="empty">No applicants yet. New candidates will appear here as applications come in.</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Interview</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dashboard.applications.map((application) => {
                const draft = applicationDrafts[application.id] || {
                  status: application.status,
                  interview_at: "",
                  decision_reason: ""
                };

                return (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.candidate?.name || "Candidate"}</strong>
                      <div className="meta">{application.candidate?.email || "-"}</div>
                    </td>
                    <td>
                      <Link href={applicationPath(application.id)} className="inline-link">
                        {application.job.title}
                      </Link>
                      <div className="meta">Applied {formatDate(application.applied_at)}</div>
                    </td>
                    <td>
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setApplicationDrafts((current) => ({
                            ...current,
                            [application.id]: { ...draft, status: event.target.value }
                          }))
                        }
                      >
                        <option value="applied">Applied</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        value={draft.interview_at}
                        onChange={(event) =>
                          setApplicationDrafts((current) => ({
                            ...current,
                            [application.id]: { ...draft, interview_at: event.target.value }
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={draft.decision_reason}
                        onChange={(event) =>
                          setApplicationDrafts((current) => ({
                            ...current,
                            [application.id]: { ...draft, decision_reason: event.target.value }
                          }))
                        }
                        placeholder="Interview note, decision context, or recruiter comment"
                      />
                    </td>
                    <td>
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={updatingApplicationId === application.id}
                        onClick={() => void handleUpdateApplication(application.id)}
                      >
                        {updatingApplicationId === application.id ? "Saving..." : "Save"}
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
        <span className="section-label">Activity Log</span>
        {!dashboard.recent_activity.length ? <div className="empty">Recent hiring activity will appear here as your team takes action.</div> : null}
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
