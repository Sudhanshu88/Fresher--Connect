from __future__ import annotations

from flask import jsonify, request
from pymongo import DESCENDING

from backend.middleware.auth import current_account
from backend.services.matching_service import attach_job_match
from backend.services.platform_service import distinct_categories, get_store, job_is_active, json_error, parse_optional_int, serialize_job


def _parse_terms(value):
    return [item.strip().lower() for item in str(value or "").split(",") if item.strip()]


def _pagination_params():
    page = parse_optional_int(request.args.get("page")) or 1
    page_size = parse_optional_int(request.args.get("page_size")) or 9
    return max(1, page), max(1, min(page_size, 24))


def _build_filter_options(jobs):
    locations = sorted({str(job.get("location") or "").strip() for job in jobs if str(job.get("location") or "").strip()}, key=str.lower)
    companies = sorted({str(job.get("company_name") or "").strip() for job in jobs if str(job.get("company_name") or "").strip()}, key=str.lower)
    experiences = sorted(
        {str(job.get("experience_level") or job.get("experience_required") or "").strip() for job in jobs if str(job.get("experience_level") or job.get("experience_required") or "").strip()},
        key=str.lower,
    )
    skills = sorted(
        {str(skill).strip() for job in jobs for skill in (job.get("required_skills") or []) if str(skill).strip()},
        key=str.lower,
    )
    salary_values = [value for job in jobs for value in (job.get("salary_min"), job.get("salary_max")) if isinstance(value, int)]
    return {
        "categories": distinct_categories(jobs),
        "locations": locations,
        "companies": companies,
        "experience_levels": experiences,
        "skills": skills,
        "salary_min": min(salary_values) if salary_values else None,
        "salary_max": max(salary_values) if salary_values else None,
    }


def _matches_job(job, filters):
    search = filters["search"]
    category = filters["category"]
    location = filters["location"]
    company = filters["company"]
    experience = filters["experience"]
    skill_terms = filters["skill_terms"]
    salary_min = filters["salary_min"]
    salary_max = filters["salary_max"]

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
    if search and search not in haystack:
        return False
    if category and not any(str(item).lower() == category for item in (job.get("categories") or [])):
        return False
    if location and location not in str(job.get("location") or "").lower():
        return False
    if company and company not in str(job.get("company_name") or "").lower():
        return False
    if experience and experience not in str(job.get("experience_level") or job.get("experience_required") or "").lower():
        return False
    if skill_terms:
        skill_haystack = " ".join(job.get("required_skills") or []).lower()
        if not all(term in skill_haystack for term in skill_terms):
            return False
    job_salary_min = job.get("salary_min")
    job_salary_max = job.get("salary_max")
    if salary_min is not None:
        if not isinstance(job_salary_max, int) or job_salary_max < salary_min:
            return False
    if salary_max is not None:
        if not isinstance(job_salary_min, int) or job_salary_min > salary_max:
            return False
    return True


def list_jobs():
    store = get_store()
    viewer = current_account(store)
    candidate = viewer if viewer and viewer.get("role") == "fresher" else None
    page, page_size = _pagination_params()
    filters = {
        "search": str(request.args.get("search") or "").strip().lower(),
        "category": str(request.args.get("category") or "").strip().lower(),
        "location": str(request.args.get("location") or "").strip().lower(),
        "company": str(request.args.get("company") or "").strip().lower(),
        "experience": str(request.args.get("experience") or "").strip().lower(),
        "skill_terms": _parse_terms(request.args.get("skills")),
        "salary_min": parse_optional_int(request.args.get("salary_min")),
        "salary_max": parse_optional_int(request.args.get("salary_max")),
    }

    all_jobs = [
        attach_job_match(candidate, serialize_job(job)) if candidate else serialize_job(job)
        for job in store.jobs.find({}, {"_id": 0}).sort("posted_date", DESCENDING)
        if job_is_active(job)
    ]
    filtered_jobs = [job for job in all_jobs if _matches_job(job, filters)]
    total = len(filtered_jobs)
    total_pages = max(1, ((total - 1) // page_size) + 1) if total else 1
    current_page = min(page, total_pages)
    start = (current_page - 1) * page_size
    jobs = filtered_jobs[start:start + page_size]

    return jsonify(
        {
            "ok": True,
            "jobs": jobs,
            "categories": distinct_categories(all_jobs),
            "filters": _build_filter_options(all_jobs),
            "pagination": {
                "page": current_page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
                "has_prev": current_page > 1,
                "has_next": current_page < total_pages,
            },
            "applied_filters": {
                "search": filters["search"],
                "category": filters["category"],
                "location": filters["location"],
                "company": filters["company"],
                "experience": filters["experience"],
                "skills": request.args.get("skills") or "",
                "salary_min": filters["salary_min"],
                "salary_max": filters["salary_max"],
                "page": current_page,
                "page_size": page_size,
            },
        }
    )


def get_job_detail(job_id):
    store = get_store()
    job = store.jobs.find_one({"$or": [{"id": int(job_id)}, {"job_id": int(job_id)}]}, {"_id": 0})
    if not job:
        return json_error("job_not_found", 404)

    viewer = current_account(store)
    is_admin = bool(viewer and viewer.get("role") == "admin")
    is_owner = bool(
        viewer
        and viewer.get("role") == "company"
        and int(viewer.get("company_id") or viewer.get("id") or 0) == int(job.get("company_id") or 0)
    )
    if not (job_is_active(job) or is_admin or is_owner):
        return json_error("job_not_found", 404)

    payload = serialize_job(job)
    if viewer and viewer.get("role") == "fresher":
        payload = attach_job_match(viewer, payload)

    return jsonify({"ok": True, "job": payload})
