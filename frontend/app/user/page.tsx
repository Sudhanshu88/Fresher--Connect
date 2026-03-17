"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { LoadingBlock } from "@/components/loading-block";
import { RoleGate } from "@/components/role-gate";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { apiRequest } from "@/lib/api";
import { formatDate, formatDateTime, toCommaList } from "@/lib/format";
import { applicationPath, jobPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

type ResumeUploadResponse = {
  ok: boolean;
  resume_url: string;
};

const defaultProfileForm = {
  name: "",
  education: "",
  grad_year: "",
  skills: "",
  phone: "",
  location: "",
  summary: "",
  experience: "fresher",
  linkedin: "",
  portfolio: ""
};

export default function UserPage() {
  return (
    <AppShell title="Candidate dashboard built as a typed React workspace." subtitle="Applications, notifications, and profile state in one route">
      <RoleGate roles={["fresher"]}>{() => <CandidateWorkspace />}</RoleGate>
    </AppShell>
  );
}

function CandidateWorkspace() {
  const dashboard = usePlatformStore((state) => state.userDashboard);
  const loadUserDashboard = usePlatformStore((state) => state.loadUserDashboard);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [profileForm, setProfileForm] = useState(defaultProfileForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);

  async function refreshDashboard() {
    const response = await loadUserDashboard();
    return response;
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await refreshDashboard();
      } catch (_error) {
        if (active) {
          setTone("error");
          setMessage("Candidate dashboard could not be loaded.");
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
    if (!dashboard?.user) {
      return;
    }
    setProfileForm({
      name: dashboard.user.name || "",
      education: dashboard.user.education || "",
      grad_year: dashboard.user.grad_year ? String(dashboard.user.grad_year) : "",
      skills: (dashboard.user.skills || []).join(", "),
      phone: dashboard.user.phone || "",
      location: dashboard.user.location || "",
      summary: dashboard.user.summary || "",
      experience: dashboard.user.experience || "fresher",
      linkedin: dashboard.user.linkedin || "",
      portfolio: dashboard.user.portfolio || ""
    });
  }, [dashboard?.user]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");

    try {
      await apiRequest("/api/user/profile", {
        method: "PATCH",
        body: {
          name: profileForm.name,
          education: profileForm.education,
          grad_year: Number(profileForm.grad_year),
          skills: profileForm.skills,
          phone: profileForm.phone,
          location: profileForm.location,
          summary: profileForm.summary,
          experience: profileForm.experience,
          linkedin: profileForm.linkedin,
          portfolio: profileForm.portfolio
        }
      });
      await refreshDashboard();
      setTone("success");
      setMessage("Profile updated.");
    } catch (_error) {
      setTone("error");
      setMessage("Profile update failed.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleResumeUpload() {
    if (!resumeFile) {
      setTone("error");
      setMessage("Choose a resume file before uploading.");
      return;
    }

    setUploadingResume(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      await apiRequest<ResumeUploadResponse>("/api/user/resume", {
        method: "POST",
        body: formData
      });
      await refreshDashboard();
      setResumeFile(null);
      setTone("success");
      setMessage("Resume uploaded and parsed.");
    } catch (_error) {
      setTone("error");
      setMessage("Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleMarkNotificationRead(notificationId: number) {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH"
      });
      await refreshDashboard();
      setTone("success");
      setMessage("Notification marked as read.");
    } catch (_error) {
      setTone("error");
      setMessage("Notification update failed.");
    }
  }

  async function handleApply(jobId: number) {
    setApplyingJobId(jobId);
    setMessage("");

    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: { job_id: jobId }
      });
      await refreshDashboard();
      setTone("success");
      setMessage("Application submitted.");
    } catch (_error) {
      setTone("error");
      setMessage("Application could not be created.");
    } finally {
      setApplyingJobId(null);
    }
  }

  if (loading && !dashboard) {
    return <LoadingBlock label="Loading candidate workspace..." />;
  }

  if (!dashboard) {
    return <Feedback message={message || "Candidate dashboard unavailable."} tone="error" />;
  }

  return (
    <div className="stack">
      <Feedback message={message} tone={tone} />

      <section className="stats-grid">
        <StatCard label="Profile" value={`${dashboard.user.profile_completion || 0}%`} hint="Completion score from backend profile fields" />
        <StatCard label="Applications" value={dashboard.applications.length} hint="All platform applications" />
        <StatCard label="Saved jobs" value={dashboard.saved_jobs.length} hint="Saved via backend saved-jobs APIs" />
        <StatCard label="Notifications" value={dashboard.notification_unread_count} hint="Unread in-app updates" />
      </section>

      <section className="detail-grid">
        <section className="panel stack">
          <div className="row">
            <div className="stack">
              <span className="section-label">Profile</span>
              <h2>{dashboard.user.name}</h2>
            </div>
            {dashboard.user.resume_url ? (
              <a className="btn secondary" href={dashboard.user.resume_url} target="_blank" rel="noreferrer">
                Open resume
              </a>
            ) : null}
          </div>
          <div className="detail-list">
            <div className="detail-item">
              <span>Email</span>
              <strong>{dashboard.user.email}</strong>
            </div>
            <div className="detail-item">
              <span>Education</span>
              <strong>{dashboard.user.education || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Graduation year</span>
              <strong>{dashboard.user.grad_year || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Skills</span>
              <strong>{toCommaList(dashboard.user.skills)}</strong>
            </div>
            <div className="detail-item">
              <span>Resume parser</span>
              <strong>{dashboard.user.resume_parser_status || "not_uploaded"}</strong>
            </div>
          </div>
        </section>

        <section className="panel stack">
          <span className="section-label">Profile editor</span>
          <form className="form" onSubmit={handleSaveProfile}>
            <div className="two-col">
              <label className="field">
                <span>Name</span>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Education</span>
                <input
                  value={profileForm.education}
                  onChange={(event) => setProfileForm((current) => ({ ...current, education: event.target.value }))}
                  required
                />
              </label>
            </div>
            <div className="two-col">
              <label className="field">
                <span>Graduation year</span>
                <input
                  type="number"
                  value={profileForm.grad_year}
                  onChange={(event) => setProfileForm((current) => ({ ...current, grad_year: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Experience</span>
                <input
                  value={profileForm.experience}
                  onChange={(event) => setProfileForm((current) => ({ ...current, experience: event.target.value }))}
                />
              </label>
            </div>
            <label className="field">
              <span>Skills</span>
              <input
                value={profileForm.skills}
                onChange={(event) => setProfileForm((current) => ({ ...current, skills: event.target.value }))}
                placeholder="React, SQL, Python"
              />
            </label>
            <div className="two-col">
              <label className="field">
                <span>Phone</span>
                <input
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Location</span>
                <input
                  value={profileForm.location}
                  onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>
            </div>
            <div className="two-col">
              <label className="field">
                <span>LinkedIn</span>
                <input
                  value={profileForm.linkedin}
                  onChange={(event) => setProfileForm((current) => ({ ...current, linkedin: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Portfolio</span>
                <input
                  value={profileForm.portfolio}
                  onChange={(event) => setProfileForm((current) => ({ ...current, portfolio: event.target.value }))}
                />
              </label>
            </div>
            <label className="field">
              <span>Summary</span>
              <textarea
                value={profileForm.summary}
                onChange={(event) => setProfileForm((current) => ({ ...current, summary: event.target.value }))}
              />
            </label>
            <button className="btn primary" type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
          <div className="field">
            <span>Upload resume</span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
            <button className="btn secondary" type="button" disabled={uploadingResume} onClick={() => void handleResumeUpload()}>
              {uploadingResume ? "Uploading..." : "Upload resume"}
            </button>
          </div>
        </section>
      </section>

      <section className="panel stack">
        <div className="row">
          <div className="stack">
            <span className="section-label">Applications</span>
            <h2>Track every hiring stage from one view</h2>
          </div>
        </div>
        {!dashboard.applications.length ? <div className="empty">No applications yet.</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Deadline</th>
                <th>Interview</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dashboard.applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.job.title}</strong>
                    <div className="meta">{application.job.company_name}</div>
                  </td>
                  <td>
                    <StatusPill value={application.status} />
                  </td>
                  <td>{formatDate(application.applied_at)}</td>
                  <td>{formatDate(application.decision_deadline)}</td>
                  <td>{formatDateTime(application.interview_at)}</td>
                  <td>
                    <Link href={applicationPath(application.id)} className="btn secondary">
                      Open timeline
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="two-col">
        <section className="panel stack">
          <span className="section-label">Notifications</span>
          <h2>Recent updates</h2>
          {!dashboard.notifications.length ? <div className="empty">No notifications available.</div> : null}
          <div className="list">
            {dashboard.notifications.map((notification) => (
              <article className="activity-card stack" key={notification.id}>
                <div className="row">
                  <strong>{notification.title}</strong>
                  <StatusPill value={notification.is_read ? "read" : "pending"} />
                </div>
                <p>{notification.message}</p>
                <div className="row">
                  <span className="helper">{formatDateTime(notification.created_at)}</span>
                  {!notification.is_read ? (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => void handleMarkNotificationRead(notification.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <span className="section-label">Recommended jobs</span>
          <h2>Continue browsing without leaving the dashboard</h2>
          {!dashboard.jobs.length ? <div className="empty">No recommended jobs available.</div> : null}
          <div className="list">
            {dashboard.jobs.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                action={
                  <button
                    className="btn primary"
                    type="button"
                    disabled={applyingJobId === job.id}
                    onClick={() => void handleApply(job.id)}
                  >
                    {applyingJobId === job.id ? "Applying..." : "Apply"}
                  </button>
                }
              />
            ))}
          </div>
          {dashboard.saved_jobs.length ? (
            <div className="stack">
              <span className="section-label">Saved jobs</span>
              <div className="tag-list">
                {dashboard.saved_jobs.slice(0, 6).map((job) => (
                  <Link className="tag" href={jobPath(job.id)} key={job.id}>
                    {job.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}
