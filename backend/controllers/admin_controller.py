from __future__ import annotations

from flask import jsonify, request
from pymongo import DESCENDING

from backend.models.constants import TRACKABLE_STATUSES
from backend.services.platform_service import get_store, job_is_active, json_error, serialize_job, serialize_user, utcnow


def _analytics_snapshot(store):
    users = store.users.count_documents({})
    candidates = store.users.count_documents({"role": "candidate"})
    companies = store.users.count_documents({"role": "company"})
    admins = store.users.count_documents({"role": "admin"})
    active_jobs = store.jobs.count_documents({"is_active": True, "moderation_status": "approved"})
    moderated_jobs = store.jobs.count_documents({"moderation_status": {"$in": ["pending", "rejected"]}})
    applications = store.applications.count_documents({})
    saved_jobs = store.saved_jobs.count_documents({})
    status_counts = {status: 0 for status in TRACKABLE_STATUSES}
    for doc in store.applications.find({}, {"status": 1, "_id": 0}):
      status = str(doc.get("status") or "applied").strip().lower()
      status_counts[status] = status_counts.get(status, 0) + 1

    return {
        "users": users,
        "candidates": candidates,
        "companies": companies,
        "admins": admins,
        "active_jobs": active_jobs,
        "moderated_jobs": moderated_jobs,
        "applications": applications,
        "saved_jobs": saved_jobs,
        "application_statuses": status_counts,
    }


def _serialize_managed_user(store, user_doc):
    db_role = user_doc.get("role")
    app_role = "admin" if db_role == "admin" else "company" if db_role == "company" else "fresher"
    account = store.get_account(app_role, user_doc["id"])
    data = serialize_user(account) if account else serialize_user(
        {
            "id": user_doc.get("id"),
            "name": user_doc.get("name"),
            "email": user_doc.get("email"),
            "role": "admin" if db_role == "admin" else "fresher",
            "db_role": db_role,
            "created_at": user_doc.get("created_at"),
            "is_active": user_doc.get("is_active", True),
        }
    )
    data["user_id"] = user_doc.get("id")
    data["db_role"] = db_role
    data["is_active"] = bool(user_doc.get("is_active", True))
    return data


def admin_dashboard(admin):
    store = get_store()
    users = [
        _serialize_managed_user(store, user)
        for user in store.users.find({}, {"_id": 0}).sort("created_at", DESCENDING)
    ]
    jobs = []
    for original in store.jobs.find({}, {"_id": 0}).sort("created_at", DESCENDING):
        job = serialize_job(original)
        job["is_active"] = bool(original.get("is_active", True))
        job["publicly_visible"] = job_is_active(original)
        job["application_count"] = store.applications.count_documents({"job_id": job["id"]})
        jobs.append(job)

    return jsonify(
        {
            "ok": True,
            "user": serialize_user(admin),
            "analytics": _analytics_snapshot(store),
            "users": users,
            "jobs": jobs,
        }
    )


def admin_users(admin):
    store = get_store()
    users = [
        _serialize_managed_user(store, user)
        for user in store.users.find({}, {"_id": 0}).sort("created_at", DESCENDING)
    ]
    return jsonify({"ok": True, "users": users})


def update_admin_user(admin, user_id):
    store = get_store()
    payload = request.get_json(silent=True) or {}
    target = store.users.find_one({"id": int(user_id)}, {"_id": 0})
    if not target:
        return json_error("user_not_found", 404)
    if target.get("role") == "admin" and target.get("id") == admin.get("id"):
        return json_error("cannot_disable_self", 400)

    updated = dict(target)
    if "is_active" in payload:
        updated["is_active"] = bool(payload.get("is_active"))
    if payload.get("role") in {"candidate", "company", "admin"}:
        updated["role"] = str(payload.get("role")).strip().lower()
    updated["updated_at"] = utcnow()
    store.users.replace_one({"id": int(user_id)}, updated)
    return jsonify({"ok": True, "user": _serialize_managed_user(store, updated)})


def admin_jobs(admin):
    store = get_store()
    jobs = []
    for original in store.jobs.find({}, {"_id": 0}).sort("created_at", DESCENDING):
        job = serialize_job(original)
        job["is_active"] = bool(original.get("is_active", True))
        job["publicly_visible"] = job_is_active(original)
        job["application_count"] = store.applications.count_documents({"job_id": job["id"]})
        jobs.append(job)
    return jsonify({"ok": True, "jobs": jobs})


def moderate_admin_job(admin, job_id):
    store = get_store()
    payload = request.get_json(silent=True) or {}
    job = store.jobs.find_one({"id": int(job_id)}, {"_id": 0})
    if not job:
        return json_error("job_not_found", 404)

    moderation_status = str(payload.get("moderation_status") or job.get("moderation_status") or "approved").strip().lower()
    if moderation_status not in {"approved", "pending", "rejected"}:
        return json_error("invalid_moderation_status", 400)

    updated = dict(job)
    updated["moderation_status"] = moderation_status
    if "is_active" in payload:
        updated["is_active"] = bool(payload.get("is_active"))
    elif moderation_status != "approved":
        updated["is_active"] = False
    updated["updated_at"] = utcnow()
    store.jobs.replace_one({"id": int(job_id)}, updated)
    serialized = serialize_job(updated)
    serialized["is_active"] = bool(updated.get("is_active", True))
    serialized["publicly_visible"] = job_is_active(updated)
    return jsonify({"ok": True, "job": serialized})
