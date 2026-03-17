import Link from "next/link";

import { jobPath } from "@/lib/routes";
import type { Job } from "@/lib/types";

export function JobCard({
  job,
  action
}: {
  job: Job;
  action?: React.ReactNode;
}) {
  return (
    <article className="job-card">
      <div className="stack">
        <span className="section-label">{job.company_name}</span>
        <h3>{job.title}</h3>
        <p className="muted">{job.description || job.role_overview || "Role details available in the full view."}</p>
      </div>
      <div className="tag-list">
        {(job.categories || []).slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
        {(job.required_skills || []).slice(0, 4).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="detail-list">
        <div className="detail-item">
          <span>Location</span>
          <strong>{job.location || "Flexible"}</strong>
        </div>
        <div className="detail-item">
          <span>Mode</span>
          <strong>{job.work_mode || "onsite"}</strong>
        </div>
        <div className="detail-item">
          <span>Compensation</span>
          <strong>{job.salary_range || "Not disclosed"}</strong>
        </div>
      </div>
      <div className="job-card-footer">
        <Link href={jobPath(job.id)} className="btn secondary">
          Open details
        </Link>
        {action}
      </div>
    </article>
  );
}
