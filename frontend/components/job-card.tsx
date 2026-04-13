import Link from "next/link";

import { formatPercent, toCommaList } from "@/lib/format";
import { jobPath } from "@/lib/routes";
import type { Job } from "@/lib/types";

export function JobCard({
  job,
  action
}: {
  job: Job;
  action?: React.ReactNode;
}) {
  const compensation = job.salary_range || job.internship_stipend || "Compensation shared by the employer";
  const stages = toCommaList(job.hiring_stages);
  const facts = [
    { label: "Location", value: job.location || "Location flexible" },
    { label: "Work model", value: job.work_mode || "On-site" },
    { label: "Experience level", value: job.experience_level || job.degree_required || "Early career" },
    { label: "Compensation", value: compensation }
  ];

  return (
    <article className="panel job-card">
      <div className="job-card-top">
        <div className="job-card-header">
          <div>
            <span className="section-label">{job.company_name}</span>
            <h3>{job.title}</h3>
          </div>
          <span className="tag">{job.job_type || job.employment_type || "Full-time"}</span>
        </div>
        <p className="job-description">
          {job.description || job.role_overview || "Explore the full opportunity brief for responsibilities, growth path, and hiring expectations."}
        </p>
        {typeof job.match_score === "number" ? (
          <div className="match-insights compact">
            <div className="match-insights-top">
              <strong>Profile alignment preview</strong>
              <span className="match-pill medium">{formatPercent(job.match_score)}</span>
            </div>
            <span className="meta-line">
              See how your current profile aligns with the employer requirements that matter most.
            </span>
          </div>
        ) : null}
        <div className="tag-list">
          {(job.categories || []).slice(0, 2).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
          {(job.required_skills || []).slice(0, 4).map((tag) => (
            <span className="tag match-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="job-card-bottom">
        <div className="detail-list compact-detail-list">
          {facts.map((fact) => (
            <div key={fact.label}>
              <strong>{fact.label}</strong>
              <span>{fact.value}</span>
            </div>
          ))}
        </div>
        <div className="job-card-footer">
          <span className="meta-line">{stages || "Structured interview stages are shared as your application progresses."}</span>
          <div className="job-card-actions">
            <Link href={jobPath(job.id)} className="btn ghost">
              View Opportunity
            </Link>
            {action}
          </div>
        </div>
      </div>
    </article>
  );
}
