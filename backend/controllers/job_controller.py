from __future__ import annotations

from flask import jsonify, request
from pymongo import DESCENDING

from backend.services.platform_service import distinct_categories, get_store, job_is_active, serialize_job


def list_jobs():
    store = get_store()
    search = str(request.args.get("search") or "").strip().lower()
    category = str(request.args.get("category") or "").strip().lower()

    jobs = [
        serialize_job(job)
        for job in store.jobs.find({}, {"_id": 0}).sort("posted_date", DESCENDING)
        if job_is_active(job)
    ]

    if search:
        filtered = []
        for job in jobs:
            haystack = " ".join(
                [
                    str(job.get("title") or ""),
                    str(job.get("company_name") or ""),
                    str(job.get("location") or ""),
                    str(job.get("department") or ""),
                    str(job.get("work_mode") or ""),
                    " ".join(job.get("required_skills") or []),
                ]
            ).lower()
            if search in haystack:
                filtered.append(job)
        jobs = filtered

    if category:
        jobs = [
            job
            for job in jobs
            if any(str(item).lower() == category for item in job.get("categories") or [])
        ]

    return jsonify({"ok": True, "jobs": jobs, "categories": distinct_categories(jobs)})
