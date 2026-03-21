"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { LoadingBlock } from "@/components/loading-block";
import { StatusPill } from "@/components/status-pill";
import { apiRequest } from "@/lib/api";
import { compactUrl, formatDate, formatPercent, toCommaList } from "@/lib/format";
import { applicationPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { Job } from "@/lib/types";

type JobDetailResponse = {
  ok: boolean;
  job: Job;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadJob() {
      try {
        const response = await apiRequest<JobDetailResponse>(`/api/jobs/${params.id}`);
        if (active) {
          setJob(response.job);
        }
      } catch (_error) {
        if (active) {
          setTone("error");
          setMessage("We couldn't load this opportunity right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadJob();
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleApply() {
    if (!job) {
      return;
    }
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`);
      return;
    }
    if (user.role !== "fresher") {
      setTone("error");
      setMessage("Applications for this role can only be submitted from a candidate account.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await apiRequest<{ ok: boolean; application: { id: number } }>("/api/applications", {
        method: "POST",
        body: { job_id: job.id }
      });
      setTone("success");
      setMessage("Your application has been submitted. We'll take you to the tracking timeline next.");
      router.push(applicationPath(response.application.id));
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't submit this application. You may have already applied, or the role may no longer be accepting candidates.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <LoadingBlock label="Loading opportunity details..." />
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <Feedback message={message || "This opportunity is no longer available."} tone="error" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="hero">
        <section className="panel stack">
          <div className="row">
            <span className="section-label">{job.company_name}</span>
            <StatusPill value={job.moderation_status || (job.is_active ? "approved" : "inactive")} />
          </div>
          <p className="muted">
            {job.description || job.role_overview || "Review the role scope, employer context, and hiring expectations below."}
          </p>
          <Feedback message={message} tone={tone} />
          <div className="button-row">
            <button className="btn primary" type="button" disabled={submitting} onClick={() => void handleApply()}>
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <Link href="/jobs" className="btn secondary">
              Back to Opportunities
            </Link>
            {job.application_method && job.application_method !== "platform" && job.application_url ? (
              <a className="btn secondary" href={job.application_url} target="_blank" rel="noreferrer">
                Apply on Company Site
              </a>
            ) : null}
          </div>
          <div className="tag-list">
            {(job.categories || []).map((item) => (
              <span className="tag" key={item}>
                {item}
              </span>
            ))}
            {(job.required_skills || []).map((item) => (
              <span className="tag" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="hero-card stack">
          <span className="section-label">Opportunity Snapshot</span>
          <div className="detail-list">
            <div className="detail-item">
              <span>Location</span>
              <strong>{job.location || "Location flexible"}</strong>
            </div>
            <div className="detail-item">
              <span>Work mode</span>
              <strong>{job.work_mode || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Employment type</span>
              <strong>{job.job_type || job.employment_type || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Compensation</span>
              <strong>{job.salary_range || job.internship_stipend || "Shared by employer"}</strong>
            </div>
            <div className="detail-item">
              <span>Posted</span>
              <strong>{formatDate(job.posted_date || job.created_at)}</strong>
            </div>
            <div className="detail-item">
              <span>Expires</span>
              <strong>{formatDate(job.expiry_date)}</strong>
            </div>
            {typeof job.match_score === "number" ? (
              <div className="detail-item">
                <span>Match score</span>
                <strong>{formatPercent(job.match_score)}</strong>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      <section className="detail-grid">
        <section className="panel stack">
          <span className="section-label">Role Highlights</span>
          <div className="detail-list">
            <div className="detail-item">
              <span>Overview</span>
              <strong>{job.role_overview || job.description || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Responsibilities</span>
              <strong>{job.responsibilities || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Required qualifications</span>
              <strong>{job.required_qualifications || job.degree_required || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Preferred qualifications</span>
              <strong>{job.preferred_qualifications || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Benefits</span>
              <strong>{job.benefits || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Hiring stages</span>
              <strong>{toCommaList(job.hiring_stages)}</strong>
            </div>
          </div>
        </section>

        <section className="panel stack">
          <span className="section-label">Employer Snapshot</span>
          <div className="detail-list">
            <div className="detail-item">
              <span>Company</span>
              <strong>{job.company_name}</strong>
            </div>
            <div className="detail-item">
              <span>Website</span>
              <strong>{compactUrl(job.company_website)}</strong>
            </div>
            <div className="detail-item">
              <span>Industry</span>
              <strong>{job.industry_type || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Size</span>
              <strong>{job.company_size || "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Description</span>
              <strong>{job.company_description || "-"}</strong>
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
