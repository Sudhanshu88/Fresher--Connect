from __future__ import annotations

from datetime import timedelta

from flask import jsonify, request
from pymongo import DESCENDING, ReturnDocument

from backend.models.constants import TRACKABLE_STATUSES
from backend.models.documents import build_job_document, merge_company_profile
from backend.services.matching_service import match_candidate_to_job
from backend.services.notification_service import notify_candidates_for_new_job
from backend.services.platform_service import (
    build_job_location,
    extract_salary_bounds,
    get_store,
    json_error,
    parse_bool,
    parse_categories,
    parse_optional_datetime,
    parse_optional_int,
    parse_skills,
    parse_tag_list,
    serialize_application,
    serialize_job,
    serialize_user,
    utcnow,
)
from backend.services.workflow_service import normalize_company_verification_status, notify_candidate_status_change, process_application_sla


def _attach_application_match(store, application):
    data = serialize_application(store, application, include_candidate=True)
    data.update(match_candidate_to_job(data.get("candidate") or {}, data.get("job") or {}))
    return data


def company_dashboard(company):
    store = get_store()
    process_application_sla(store)
    posted_jobs = []
    for job in store.jobs.find({"company_id": company["company_id"]}, {"_id": 0}).sort("posted_date", DESCENDING):
        data = serialize_job(job)
        data["application_count"] = store.applications.count_documents({"job_id": job["job_id"]})
        posted_jobs.append(data)

    application_docs = list(
        store.applications.find({"company_id": company["company_id"]}, {"_id": 0}).sort("applied_at", DESCENDING)
    )
    status_counts = {status: 0 for status in TRACKABLE_STATUSES}
    for item in application_docs:
        status = item.get("status", "applied")
        status_counts[status] = status_counts.get(status, 0) + 1

    return jsonify(
        {
            "ok": True,
            "user": serialize_user(company),
            "posted_jobs": posted_jobs,
            "applications": [_attach_application_match(store, item) for item in application_docs],
            "status_counts": status_counts,
            "overdue_applications": sum(1 for item in application_docs if item.get("status") in {"applied", "reviewing"} and parse_optional_datetime(item.get("decision_deadline")) and parse_optional_datetime(item.get("decision_deadline")) < utcnow()),
        }
    )


def company_jobs(company):
    store = get_store()
    process_application_sla(store)
    jobs = []
    for job in store.jobs.find({"company_id": company["company_id"]}, {"_id": 0}).sort("posted_date", DESCENDING):
        data = serialize_job(job)
        data["application_count"] = store.applications.count_documents({"job_id": job["job_id"]})
        jobs.append(data)
    return jsonify({"ok": True, "jobs": jobs})


def create_company_job(company):
    store = get_store()
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("job_title") or payload.get("title") or "").strip()
    description = str(payload.get("job_description") or payload.get("description") or "").strip()
    experience_required = str(payload.get("experience_required") or payload.get("experience_level") or "").strip()
    education_required = str(payload.get("education_required") or payload.get("degree_required") or "").strip()
    employment_type = str(payload.get("employment_type") or payload.get("job_type") or "").strip()
    work_mode = str(payload.get("work_mode") or "").strip()
    department = str(payload.get("department") or "").strip()
    required_skills = parse_skills(payload.get("skills") or payload.get("required_skills"))

    if not title:
        return json_error("job_title_required", 400)
    if not description:
        return json_error("job_description_required", 400)
    if not experience_required:
        return json_error("experience_required", 400)
    if not education_required:
        return json_error("education_required", 400)
    if not employment_type:
        return json_error("employment_type_required", 400)
    if not department:
        return json_error("department_required", 400)
    if work_mode not in {"onsite", "remote", "hybrid"}:
        return json_error("work_mode_required", 400)
    if not required_skills:
        return json_error("skills_required", 400)

    company_doc = merge_company_profile(company, payload, utcnow())
    if not company_doc["company_name"]:
        return json_error("company_name_required", 400)

    store.companies.replace_one({"company_id": company["company_id"]}, company_doc)
    company_doc = store.companies.find_one({"company_id": company["company_id"]}, {"_id": 0})

    salary_min = parse_optional_int(payload.get("salary_min"))
    salary_max = parse_optional_int(payload.get("salary_max"))
    if salary_min is None and salary_max is None:
        salary_min, salary_max = extract_salary_bounds(payload.get("salary_range"))

    posted_date = parse_optional_datetime(payload.get("posted_date")) or utcnow()
    expiry_date = parse_optional_datetime(payload.get("expiry_date"))
    if expiry_date is None:
        expiry_date = posted_date + timedelta(days=parse_optional_int(payload.get("expiry_days")) or 30)

    job = build_job_document(
        job_id=store.next_sequence("jobs"),
        company_doc=company_doc,
        title=title,
        description=description,
        experience_required=experience_required,
        education_required=education_required,
        salary_min=salary_min,
        salary_max=salary_max,
        location=build_job_location(payload),
        employment_type=employment_type,
        required_skills=required_skills,
        posted_date=posted_date,
        expiry_date=expiry_date,
        department=department,
        work_mode=work_mode,
        country=str(payload.get("country") or "").strip(),
        state=str(payload.get("state") or "").strip(),
        city=str(payload.get("city") or "").strip(),
        remote_option=parse_bool(payload.get("remote_option"), default=work_mode == "remote"),
        role_overview=str(payload.get("role_overview") or "").strip(),
        responsibilities=str(payload.get("responsibilities") or "").strip(),
        required_qualifications=str(payload.get("required_qualifications") or "").strip(),
        preferred_qualifications=str(payload.get("preferred_qualifications") or "").strip(),
        salary_range=str(payload.get("salary_range") or "").strip(),
        internship_stipend=str(payload.get("internship_stipend") or "").strip(),
        benefits=str(payload.get("benefits") or "").strip(),
        application_method=str(payload.get("application_method") or "platform").strip(),
        application_url=str(payload.get("application_url") or "").strip(),
        application_email=str(payload.get("application_email") or "").strip(),
        resume_required=parse_bool(payload.get("resume_required"), default=True),
        portfolio_required=parse_bool(payload.get("portfolio_required"), default=False),
        cover_letter_required=parse_bool(payload.get("cover_letter_required"), default=False),
        hiring_stages=parse_tag_list(payload.get("hiring_stages")),
        categories=parse_categories(payload, company_doc),
        created_at=utcnow(),
    )

    verification_status = normalize_company_verification_status(company_doc.get("verification_status"), default="verified")
    if verification_status != "verified":
        job["moderation_status"] = "pending"
        job["is_active"] = False

    store.jobs.insert_one(job)
    notification_summary = (
        notify_candidates_for_new_job(store, job)
        if verification_status == "verified" and job.get("moderation_status") == "approved"
        else {"notifications_created": 0, "emails_sent": 0, "email_mode": "in_app_only"}
    )
    return jsonify({"ok": True, "job": serialize_job(job), "notification_summary": notification_summary})


def company_applications(company):
    store = get_store()
    process_application_sla(store)
    applications = [
        _attach_application_match(store, item)
        for item in store.applications.find({"company_id": company["company_id"]}, {"_id": 0}).sort("applied_at", DESCENDING)
    ]
    return jsonify({"ok": True, "applications": applications})


def update_company_application(company, application_id):
    store = get_store()
    process_application_sla(store)
    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status") or "").strip().lower()
    if status not in TRACKABLE_STATUSES:
        return json_error("invalid_status", 400)

    original = store.applications.find_one({"application_id": application_id, "company_id": company["company_id"]}, {"_id": 0})
    if not original:
        return json_error("application_not_found", 404)

    interview_at = None
    if "interview_at" in payload and str(payload.get("interview_at") or "").strip():
        interview_at = parse_optional_datetime(payload.get("interview_at"))
        if interview_at is None:
            return json_error("invalid_interview_time", 400)
    elif status == "interview":
        interview_at = parse_optional_datetime(original.get("interview_at"))

    updates = {
        "status": status,
        "updated_at": utcnow(),
        "last_company_action_at": utcnow(),
    }
    if status == "interview":
        updates["interview_at"] = interview_at
    elif "interview_at" in payload:
        updates["interview_at"] = None

    if "decision_reason" in payload:
        updates["decision_reason"] = str(payload.get("decision_reason") or "").strip()
    elif status != "rejected":
        updates["decision_reason"] = ""

    application = store.applications.find_one_and_update(
        {"application_id": application_id, "company_id": company["company_id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )

    candidate = store.get_account("fresher", application.get("candidate_id") or application.get("user_id"))
    job = store.jobs.find_one({"$or": [{"job_id": application.get("job_id")}, {"id": application.get("job_id")}]}, {"_id": 0}) or {}
    notify_candidate_status_change(store, application, candidate, job, original.get("status"))
    return jsonify({"ok": True, "application": _attach_application_match(store, application)})
