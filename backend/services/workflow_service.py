from __future__ import annotations

from datetime import timedelta

from backend.services.notification_service import create_notification
from backend.services.platform_service import isoformat, parse_optional_datetime, utcnow


APPLICATION_SLA_DAYS = 7
APPLICATION_PENDING_STATUSES = {"applied", "reviewing"}
COMPANY_VERIFICATION_STATUSES = {"verified", "pending", "rejected"}


def normalize_company_verification_status(value, default="verified"):
    status = str(value or default).strip().lower()
    return status if status in COMPANY_VERIFICATION_STATUSES else default


def decision_deadline_for(applied_at):
    base_time = parse_optional_datetime(applied_at) or utcnow()
    return base_time + timedelta(days=APPLICATION_SLA_DAYS)


def application_requires_company_action(status):
    return str(status or "applied").strip().lower() in APPLICATION_PENDING_STATUSES


def is_application_overdue(application, now=None):
    current_time = now or utcnow()
    deadline = parse_optional_datetime(application.get("decision_deadline"))
    if deadline is None:
        deadline = decision_deadline_for(application.get("applied_at"))
    return application_requires_company_action(application.get("status")) and deadline < current_time


def backfill_company_workflow_fields(store):
    current_time = utcnow()
    for company in store.companies.find({}, {"_id": 0}):
        updates = {}
        if not company.get("verification_status"):
            updates["verification_status"] = "verified"
            updates["verification_updated_at"] = current_time
        if updates:
            store.companies.update_one(
                {"company_id": company.get("company_id") or company.get("id")},
                {"$set": updates},
            )


def backfill_application_workflow_fields(store):
    current_time = utcnow()
    for application in store.applications.find({}, {"_id": 0}):
        updates = {}
        applied_at = parse_optional_datetime(application.get("applied_at")) or current_time
        if not application.get("decision_deadline"):
            updates["decision_deadline"] = decision_deadline_for(applied_at)
        if "interview_at" not in application:
            updates["interview_at"] = None
        if "decision_reason" not in application:
            updates["decision_reason"] = ""
        if "last_company_action_at" not in application:
            updates["last_company_action_at"] = None
        if updates:
            store.applications.update_one(
                {"application_id": application.get("application_id") or application.get("id")},
                {"$set": updates},
            )


def ensure_workflow_defaults(store):
    backfill_company_workflow_fields(store)
    backfill_application_workflow_fields(store)


def notify_application_submitted(store, application, candidate, job):
    if not candidate:
        return None

    title = "Application submitted"
    message = (
        f"You applied to {job.get('title') or 'the role'} at {job.get('company_name') or 'the company'}."
        f" Expect an update within {APPLICATION_SLA_DAYS} days."
    )
    return create_notification(
        store,
        user_id=candidate.get("user_id") or candidate.get("id"),
        notification_type="application_submitted",
        title=title,
        message=message,
        metadata={
            "application_id": application.get("application_id") or application.get("id"),
            "job_id": application.get("job_id"),
            "status": application.get("status"),
            "decision_deadline": isoformat(parse_optional_datetime(application.get("decision_deadline"))),
        },
        email=candidate.get("email"),
    )


def notify_candidate_status_change(store, application, candidate, job, previous_status):
    if not candidate:
        return None

    new_status = str(application.get("status") or "applied").strip().lower()
    interview_at = parse_optional_datetime(application.get("interview_at"))
    title = f"Application update: {new_status.replace('_', ' ').title()}"
    message = (
        f"{job.get('company_name') or 'A company'} updated your application for "
        f"{job.get('title') or 'the role'} from {str(previous_status or 'applied').title()} to {new_status.title()}."
    )
    if new_status == "interview" and interview_at:
        message += f" Interview scheduled for {interview_at.strftime('%d %b %Y %I:%M %p UTC')}."
    elif new_status == "rejected" and application.get("decision_reason"):
        message += f" Reason: {application.get('decision_reason')}."

    return create_notification(
        store,
        user_id=candidate.get("user_id") or candidate.get("id"),
        notification_type="application_status_update",
        title=title,
        message=message,
        metadata={
            "application_id": application.get("application_id") or application.get("id"),
            "job_id": application.get("job_id"),
            "status": new_status,
            "interview_at": isoformat(interview_at),
        },
        email=candidate.get("email"),
    )


def process_application_sla(store, now=None):
    current_time = now or utcnow()
    expired = []

    for application in store.applications.find({"status": {"$in": sorted(APPLICATION_PENDING_STATUSES)}}, {"_id": 0}):
        if not is_application_overdue(application, current_time):
            continue

        application_id = application.get("application_id") or application.get("id")
        store.applications.update_one(
            {"application_id": application_id},
            {
                "$set": {
                    "status": "rejected",
                    "updated_at": current_time,
                    "last_company_action_at": current_time,
                    "sla_breached_at": current_time,
                    "decision_reason": "Auto-closed after 7 days without recruiter action.",
                }
            },
        )

        updated = dict(application)
        updated.update(
            {
                "status": "rejected",
                "updated_at": current_time,
                "last_company_action_at": current_time,
                "sla_breached_at": current_time,
                "decision_reason": "Auto-closed after 7 days without recruiter action.",
            }
        )

        job = store.jobs.find_one(
            {"$or": [{"job_id": updated.get("job_id")}, {"id": updated.get("job_id")}]},
            {"_id": 0},
        ) or {}
        candidate = store.get_account("fresher", updated.get("candidate_id") or updated.get("user_id"))
        company = store.get_account("company", updated.get("company_id"))

        if candidate:
            create_notification(
                store,
                user_id=candidate.get("user_id") or candidate.get("id"),
                notification_type="application_timeout",
                title="Application auto-closed after 7 days",
                message=(
                    f"{job.get('company_name') or 'The company'} did not update your application for "
                    f"{job.get('title') or 'the role'} within {APPLICATION_SLA_DAYS} days, so it was marked as rejected."
                ),
                metadata={
                    "application_id": application_id,
                    "job_id": updated.get("job_id"),
                    "status": "rejected",
                    "reason": "decision_timeout",
                },
                email=candidate.get("email"),
            )

        if company:
            create_notification(
                store,
                user_id=company.get("owner_user_id") or company.get("id"),
                notification_type="application_timeout_company",
                title="Application auto-rejected by SLA",
                message=(
                    f"Candidate application for {job.get('title') or 'the role'} was auto-rejected after "
                    f"{APPLICATION_SLA_DAYS} days without action."
                ),
                metadata={
                    "application_id": application_id,
                    "job_id": updated.get("job_id"),
                    "status": "rejected",
                    "reason": "decision_timeout",
                },
                email=company.get("email"),
            )

        expired.append(updated)

    return {
        "processed": len(expired),
        "expired_application_ids": [item.get("application_id") or item.get("id") for item in expired],
        "sla_days": APPLICATION_SLA_DAYS,
    }
