from __future__ import annotations

from flask import jsonify, request
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from backend.services.platform_service import (
    distinct_categories,
    get_store,
    job_is_active,
    json_error,
    parse_optional_int,
    parse_skills,
    serialize_application,
    serialize_job,
    serialize_user,
    utcnow,
)


def user_dashboard(user):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    jobs = [
        serialize_job(job)
        for job in store.jobs.find({}, {"_id": 0}).sort("posted_date", DESCENDING)
        if job_is_active(job)
    ]
    applications = [
        serialize_application(store, application)
        for application in store.applications.find(
            {"$or": [{"candidate_id": candidate_id}, {"user_id": candidate_id}]},
            {"_id": 0},
        ).sort("applied_at", DESCENDING)
    ]
    return jsonify(
        {
            "ok": True,
            "user": serialize_user(user),
            "jobs": jobs,
            "categories": distinct_categories(jobs),
            "applications": applications,
        }
    )


def update_user_profile(user):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name") or user.get("name") or "").strip()
    education = str(payload.get("education") or user.get("education") or "").strip()
    grad_year = parse_optional_int(payload.get("grad_year"))
    if grad_year is None:
        grad_year = user.get("grad_year")

    if not name:
        return json_error("name_required", 400)
    if not education:
        return json_error("education_required", 400)
    if grad_year is None:
        return json_error("grad_year_required", 400)

    now = utcnow()
    store.users.update_one(
        {"id": candidate_id},
        {"$set": {"name": name, "updated_at": now}},
    )

    existing_profile = store.candidate_profiles.find_one({"user_id": candidate_id}, {"_id": 0}) or {
        "user_id": candidate_id,
        "created_at": user.get("created_at") or now,
    }
    existing_profile.update(
        {
            "phone": str(payload.get("phone") or "").strip(),
            "location": str(payload.get("location") or "").strip(),
            "education": education,
            "grad_year": grad_year,
            "skills": parse_skills(payload.get("skills")),
            "experience": str(payload.get("experience") or user.get("experience") or "fresher").strip(),
            "summary": str(payload.get("summary") or "").strip(),
            "resume_url": str(payload.get("resume_url") or payload.get("resume_path") or "").strip(),
            "linkedin": str(payload.get("linkedin") or user.get("linkedin") or "").strip(),
            "portfolio": str(payload.get("portfolio") or user.get("portfolio") or "").strip(),
            "updated_at": now,
        }
    )
    store.candidate_profiles.replace_one({"user_id": candidate_id}, existing_profile, upsert=True)
    return jsonify({"ok": True, "user": serialize_user(store.get_account("fresher", candidate_id))})


def create_application(user):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    payload = request.get_json(silent=True) or {}
    job_id = parse_optional_int(payload.get("job_id"))
    if job_id is None:
        return json_error("job_id_required", 400)

    job = store.jobs.find_one({"$or": [{"id": job_id}, {"job_id": job_id}]}, {"_id": 0})
    if not job or not job_is_active(job):
        return json_error("job_not_available", 404)

    application = {
        "id": store.next_sequence("applications"),
        "application_id": None,
        "candidate_id": candidate_id,
        "user_id": candidate_id,
        "company_id": job["company_id"],
        "job_id": job.get("job_id") or job.get("id"),
        "status": "applied",
        "applied_at": utcnow(),
        "updated_at": utcnow(),
    }
    application["application_id"] = application["id"]
    try:
        store.applications.insert_one(application)
    except DuplicateKeyError:
        return json_error("already_applied", 409)

    return jsonify({"ok": True, "application": serialize_application(store, application)})


def my_applications(user):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    applications = [
        serialize_application(store, application)
        for application in store.applications.find(
            {"$or": [{"candidate_id": candidate_id}, {"user_id": candidate_id}]},
            {"_id": 0},
        ).sort("applied_at", DESCENDING)
    ]
    return jsonify({"ok": True, "applications": applications})
