from __future__ import annotations

import os
from secrets import token_hex

from flask import jsonify, request
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError
from werkzeug.utils import secure_filename

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
    saved_jobs = []
    for item in store.saved_jobs.find({"candidate_id": candidate_id}, {"_id": 0}).sort("created_at", DESCENDING):
        job = store.jobs.find_one({"$or": [{"id": item.get("job_id")}, {"job_id": item.get("job_id")}]}, {"_id": 0})
        if job:
            data = serialize_job(job)
            data["saved_at"] = item.get("created_at")
            saved_jobs.append(data)
    return jsonify(
        {
            "ok": True,
            "user": serialize_user(user),
            "jobs": jobs,
            "categories": distinct_categories(jobs),
            "applications": applications,
            "saved_jobs": saved_jobs,
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


def create_application(user, job_id=None):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    payload = request.get_json(silent=True) or {}
    resolved_job_id = parse_optional_int(job_id)
    if resolved_job_id is None:
        resolved_job_id = parse_optional_int(payload.get("job_id"))
    if resolved_job_id is None:
        return json_error("job_id_required", 400)

    job = store.jobs.find_one({"$or": [{"id": resolved_job_id}, {"job_id": resolved_job_id}]}, {"_id": 0})
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


def my_saved_jobs(user):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    saved = list(
        store.saved_jobs.find({"candidate_id": candidate_id}, {"_id": 0}).sort("created_at", DESCENDING)
    )
    jobs = []
    for item in saved:
        job = store.jobs.find_one({"$or": [{"id": item.get("job_id")}, {"job_id": item.get("job_id")}]}, {"_id": 0})
        if job:
            data = serialize_job(job)
            data["saved_at"] = item.get("created_at")
            jobs.append(data)
    return jsonify({"ok": True, "saved_jobs": jobs})


def save_job(user):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    payload = request.get_json(silent=True) or {}
    job_id = parse_optional_int(payload.get("job_id"))
    if job_id is None:
        return json_error("job_id_required", 400)
    job = store.jobs.find_one({"$or": [{"id": job_id}, {"job_id": job_id}]}, {"_id": 0})
    if not job or not job_is_active(job):
        return json_error("job_not_found", 404)

    record = {
        "id": store.next_sequence("saved_jobs"),
        "candidate_id": candidate_id,
        "job_id": job_id,
        "created_at": utcnow(),
    }
    try:
        store.saved_jobs.insert_one(record)
    except DuplicateKeyError:
        return json_error("already_saved", 409)
    return jsonify({"ok": True, "saved_job": {"id": record["id"], "job_id": job_id}})


def unsave_job(user, job_id):
    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    result = store.saved_jobs.delete_one({"candidate_id": candidate_id, "job_id": int(job_id)})
    if result.deleted_count == 0:
        return json_error("saved_job_not_found", 404)
    return jsonify({"ok": True})


def upload_resume(user):
    from flask import current_app

    store = get_store()
    candidate_id = user.get("user_id") or user.get("id")
    file = request.files.get("resume")
    if not file or not file.filename:
        return json_error("resume_file_required", 400)

    filename = secure_filename(file.filename)
    if not filename:
        return json_error("invalid_file_name", 400)
    extension = os.path.splitext(filename)[1].lower()
    if extension not in {".pdf", ".doc", ".docx"}:
        return json_error("invalid_resume_type", 400)

    stored_name = f"{candidate_id}-{token_hex(8)}{extension}"
    destination = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    file.save(destination)
    resume_url = request.url_root.rstrip("/") + "/api/uploads/" + stored_name

    profile = store.candidate_profiles.find_one({"user_id": candidate_id}, {"_id": 0}) or {
        "user_id": candidate_id,
        "created_at": utcnow(),
    }
    profile["resume_url"] = resume_url
    profile["updated_at"] = utcnow()
    store.candidate_profiles.replace_one({"user_id": candidate_id}, profile, upsert=True)
    return jsonify({"ok": True, "resume_url": resume_url, "user": serialize_user(store.get_account("fresher", candidate_id))})
