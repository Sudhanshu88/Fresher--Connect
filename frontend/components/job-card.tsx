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
  const compensation = job.salary_range || job.internship_stipend || "Compensation not disclosed";
  const stages = toCommaList(job.hiring_stages);
  const facts = [
    { label: "Location", value: job.location || "Flexible" },
    { label: "Work mode", value: job.work_mode || "Onsite" },
    { label: "Experience", value: job.experience_level || job.degree_required || "Entry-level" },
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
          {job.description || job.role_overview || "Role details are available in the full job view."}
        </p>
        {typeof job.match_score === "number" ? (
          <div className="match-insights compact">
            <div className="match-insights-top">
              <strong>Candidate fit preview</strong>
              <span className="match-pill medium">{formatPercent(job.match_score)}</span>
            </div>
            <span className="meta-line">
              Backend scoring compares your profile with the role skills and hiring criteria.
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
          <span className="meta-line">{stages || "Structured hiring stages shared after application review."}</span>
          <div className="job-card-actions">
            <Link href={jobPath(job.id)} className="btn ghost">
              Review role
            </Link>
            {action}
          </div>
        </div>
      </div>
    </article>
  );
}
