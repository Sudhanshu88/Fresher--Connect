from __future__ import annotations

from datetime import datetime
from io import BytesIO

from flask import current_app, jsonify, request, send_file, send_from_directory
from pymongo import DESCENDING
from pymongo.errors import PyMongoError

from backend.middleware.auth import current_account
from backend.services.platform_service import (
    get_store,
    isoformat,
    json_error,
    parse_optional_datetime,
    parse_optional_int,
    serialize_user,
    utcnow,
)
from backend.services.storage_service import open_upload, storage_backend, upload_path_for_key


def index():
    return jsonify(
        {
            "ok": True,
            "service": "fresher-connect-backend",
            "database": "mongodb",
            "frontend_hint": "Open http://127.0.0.1:3000",
            "frontend_api_base": "http://127.0.0.1:5000",
        }
    )


def api_session():
    return jsonify(
        {
            "ok": True,
            "user": serialize_user(current_account()),
        }
    )


def healthcheck():
    store = get_store()
    try:
        store.ping()
        return jsonify({"database": "available", "engine": "mongodb", "ok": True})
    except (PyMongoError, RuntimeError) as error:
        current_app.logger.warning("Healthcheck error: %s", error)
        return jsonify({"database": "unavailable", "engine": "mongodb", "ok": False}), 503


def uploaded_file(filename):
    as_attachment = str(request.args.get("download") or "").strip().lower() in {"1", "true", "yes"}
    if storage_backend(current_app.config) == "s3":
        payload = open_upload(filename, current_app.config)
        if not payload:
            return json_error("upload_not_found", 404)
        return send_file(
            BytesIO(payload["body"]),
            mimetype=payload["content_type"],
            download_name=payload["filename"],
            as_attachment=as_attachment,
        )

    path = upload_path_for_key(filename, current_app.config)
    if not path.exists():
        return json_error("upload_not_found", 404)
    return send_from_directory(path.parent, path.name, as_attachment=as_attachment)


def serialize_review(review):
    if not review:
        return None
    return {
        "id": review.get("id"),
        "name": review.get("name"),
        "role": review.get("role"),
        "rating": int(review.get("rating") or 0),
        "review": review.get("review"),
        "user_id": review.get("user_id"),
        "created_at": isoformat(review.get("created_at")),
        "updated_at": isoformat(review.get("updated_at")),
    }


def _update_sort_time(record, *keys):
    for key in keys:
        parsed = parse_optional_datetime(record.get(key))
        if parsed:
            return parsed
    return datetime.min


def serialize_live_update(update):
    if not update:
        return None
    return {
        "id": update.get("id"),
        "type": update.get("type"),
        "title": update.get("title"),
        "message": update.get("message"),
        "company_name": update.get("company_name"),
        "created_at": isoformat(update.get("created_at")),
    }


def list_live_updates():
    store = get_store()
    limit = parse_optional_int(request.args.get("limit")) or 10
    limit = max(4, min(limit, 20))

    company_updates = [
        {
            "id": f"company-{company.get('company_id') or company.get('id')}",
            "type": "company",
            "title": str(company.get("company_name") or "Unnamed company").strip(),
            "message": "New company joined",
            "company_name": str(company.get("company_name") or "Unnamed company").strip(),
            "created_at": _update_sort_time(company, "created_at", "updated_at"),
        }
        for company in store.companies.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit)
        if str(company.get("company_name") or "").strip()
    ]

    job_updates = [
        {
            "id": f"job-{job.get('job_id') or job.get('id')}",
            "type": "job",
            "title": str(job.get("title") or job.get("job_title") or "Untitled role").strip(),
            "message": str(job.get("company_name") or "Unknown company").strip(),
            "company_name": str(job.get("company_name") or "Unknown company").strip(),
            "created_at": _update_sort_time(job, "posted_date", "created_at", "updated_at"),
        }
        for job in store.jobs.find({"is_active": True, "moderation_status": "approved"}, {"_id": 0}).sort("posted_date", DESCENDING).limit(limit)
        if str(job.get("title") or job.get("job_title") or "").strip()
    ]

    updates = company_updates + job_updates
    updates.sort(key=lambda item: item.get("created_at") or datetime.min, reverse=True)

    return jsonify({"ok": True, "updates": [serialize_live_update(item) for item in updates[:limit]]})


def list_reviews():
    store = get_store()
    limit = parse_optional_int(request.args.get("limit")) or 8
    limit = max(1, min(limit, 20))
    reviews = [
        serialize_review(item)
        for item in store.reviews.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit)
    ]
    return jsonify({"ok": True, "reviews": reviews})


def create_review():
    store = get_store()
    viewer = current_account(store)
    payload = request.get_json(silent=True) or {}

    name = str(payload.get("name") or "").strip()
    if not name and viewer:
        name = (
            str(viewer.get("company_name") or "").strip()
            or str(viewer.get("name") or "").strip()
            or str(viewer.get("email") or "").strip()
        )
    if not name:
        return json_error("name_required", 400)

    role = str(payload.get("role") or (viewer or {}).get("role") or "guest").strip().lower()
    if role not in {"fresher", "company", "guest"}:
        role = "guest"

    review_text = str(payload.get("review") or "").strip()
    if not review_text:
        return json_error("review_required", 400)

    rating = parse_optional_int(payload.get("rating"))
    if rating is None or rating < 1 or rating > 5:
        return json_error("rating_invalid", 400)

    timestamp = utcnow()
    review = {
        "id": store.next_sequence("reviews"),
        "name": name,
        "role": role,
        "rating": rating,
        "review": review_text,
        "user_id": (viewer or {}).get("id"),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    store.reviews.insert_one(review)
    return jsonify({"ok": True, "review": serialize_review(review)}), 201
