"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { LoadingBlock } from "@/components/loading-block";
import { RoleGate } from "@/components/role-gate";
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
    <AppShell>
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
          setMessage("We couldn't open your career dashboard right now.");
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
      setMessage("Your profile has been updated successfully.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't save your profile changes. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleResumeUpload() {
    if (!resumeFile) {
      setTone("error");
      setMessage("Please choose a resume before uploading.");
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
      setMessage("Your resume is live and ready for future applications.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't upload your resume. Please try again.");
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
      setMessage("Notification marked as reviewed.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't update that notification right now.");
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
      setMessage("Application submitted successfully. We'll keep you updated at every stage.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't submit your application. Please try again in a moment.");
    } finally {
      setApplyingJobId(null);
    }
  }

  if (loading && !dashboard) {
    return <LoadingBlock label="Loading your career dashboard..." />;
  }

  if (!dashboard) {
    return <Feedback message={message || "Your career dashboard is currently unavailable."} tone="error" />;
  }

  return (
    <div className="stack">
      <Feedback message={message} tone={tone} />

      <section className="panel dashboard-hero-panel">
        <div className="dashboard-hero-grid">
          <div className="page-intro">
            <span className="section-label">Career Dashboard</span>
            <h1 className="page-title">Stay ahead of every opportunity, application, and recruiter update.</h1>
            <p className="muted">Your profile, resume, job matches, and hiring progress are organized in one professional workspace.</p>
          </div>
          <div className="hero-mini-grid">
            <div className="mini-stat">
              <span>Profile strength</span>
              <strong>{dashboard.user.profile_completion || 0}%</strong>
            </div>
            <div className="mini-stat">
              <span>Applications</span>
              <strong>{dashboard.applications.length}</strong>
            </div>
            <div className="mini-stat">
              <span>Unread updates</span>
              <strong>{dashboard.notification_unread_count}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <section className="panel stack">
          <div className="row">
            <div className="stack">
              <span className="section-label">Professional Profile</span>
              <h2>{dashboard.user.name}</h2>
            </div>
            {dashboard.user.resume_url ? (
              <a className="btn secondary" href={dashboard.user.resume_url} target="_blank" rel="noreferrer">
                View Resume
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
          <span className="section-label">Profile Editor</span>
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
              {savingProfile ? "Saving changes..." : "Save Profile Changes"}
            </button>
          </form>
          <div className="field">
            <span>Resume Upload</span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
            <button className="btn secondary" type="button" disabled={uploadingResume} onClick={() => void handleResumeUpload()}>
              {uploadingResume ? "Uploading resume..." : "Upload Resume"}
            </button>
          </div>
        </section>
      </section>

      <section className="panel stack">
        <div className="row">
          <div className="stack">
            <span className="section-label">Applications</span>
            <h2>Track every hiring stage from one clear timeline</h2>
          </div>
        </div>
        {!dashboard.applications.length ? <div className="empty">No applications yet. Start with a verified opportunity that fits your goals.</div> : null}
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
                      View Timeline
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
          <h2>Recent hiring updates</h2>
          {!dashboard.notifications.length ? <div className="empty">No updates yet. Recruiter activity and reminders will appear here.</div> : null}
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
                      Mark as Read
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <span className="section-label">Recommended Opportunities</span>
          <h2>Keep momentum with roles matched to your profile</h2>
          {!dashboard.jobs.length ? <div className="empty">No recommended opportunities are available yet.</div> : null}
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
                    {applyingJobId === job.id ? "Submitting..." : "Apply Now"}
                  </button>
                }
              />
            ))}
          </div>
          {dashboard.saved_jobs.length ? (
            <div className="stack">
              <span className="section-label">Saved Opportunities</span>
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
