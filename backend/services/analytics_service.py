from __future__ import annotations

from backend.services.platform_service import job_is_active, parse_optional_datetime
from backend.services.workflow_service import application_requires_company_action


def _percent(part, whole):
    if not whole:
        return 0
    return round((float(part) / float(whole)) * 100, 1)


def build_company_analytics(store, company_id):
    jobs = list(store.jobs.find({"company_id": int(company_id)}, {"_id": 0}))
    applications = list(store.applications.find({"company_id": int(company_id)}, {"_id": 0}))

    total_applicants = len(applications)
    shortlisted = sum(1 for item in applications if item.get("status") in {"shortlisted", "interview", "offered"})
    interviewed = sum(1 for item in applications if item.get("status") == "interview")
    offered = sum(1 for item in applications if item.get("status") == "offered")
    rejected = sum(1 for item in applications if item.get("status") == "rejected")
    decided = sum(1 for item in applications if not application_requires_company_action(item.get("status")))
    sla_breaches = sum(1 for item in applications if item.get("sla_breached_at"))

    decision_hours = []
    for item in applications:
        if application_requires_company_action(item.get("status")):
            continue
        applied_at = parse_optional_datetime(item.get("applied_at"))
        updated_at = parse_optional_datetime(item.get("updated_at"))
        if not applied_at or not updated_at or updated_at < applied_at:
            continue
        decision_hours.append((updated_at - applied_at).total_seconds() / 3600.0)

    job_metrics = []
    for job in jobs:
        job_id = job.get("job_id") or job.get("id")
        job_applications = [item for item in applications if int(item.get("job_id") or 0) == int(job_id or 0)]
        job_metrics.append(
            {
                "job_id": job_id,
                "title": job.get("title") or "Untitled role",
                "application_count": len(job_applications),
                "shortlisted_count": sum(1 for item in job_applications if item.get("status") in {"shortlisted", "interview", "offered"}),
                "interview_count": sum(1 for item in job_applications if item.get("status") == "interview"),
                "rejected_count": sum(1 for item in job_applications if item.get("status") == "rejected"),
                "offer_count": sum(1 for item in job_applications if item.get("status") == "offered"),
                "decision_rate": _percent(
                    sum(1 for item in job_applications if not application_requires_company_action(item.get("status"))),
                    len(job_applications),
                ),
            }
        )

    job_metrics.sort(key=lambda item: (-item["application_count"], item["title"].lower()))

    return {
        "open_jobs": sum(1 for item in jobs if job_is_active(item)),
        "total_jobs": len(jobs),
        "total_applicants": total_applicants,
        "shortlisted_rate": _percent(shortlisted, total_applicants),
        "interview_rate": _percent(interviewed, total_applicants),
        "offer_rate": _percent(offered, total_applicants),
        "rejection_rate": _percent(rejected, total_applicants),
        "decision_rate": _percent(decided, total_applicants),
        "sla_breaches": sla_breaches,
        "avg_decision_hours": round(sum(decision_hours) / len(decision_hours), 1) if decision_hours else 0,
        "top_jobs": job_metrics[:5],
    }
