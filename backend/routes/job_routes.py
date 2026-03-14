from __future__ import annotations

from flask import Blueprint

from backend.controllers.job_controller import get_job_detail, list_jobs


jobs_bp = Blueprint("jobs", __name__)

jobs_bp.get("/api/jobs")(list_jobs)
jobs_bp.get("/api/jobs/<int:job_id>")(get_job_detail)
jobs_bp.add_url_rule("/jobs", endpoint="list_jobs_rest", view_func=list_jobs, methods=["GET"])
jobs_bp.add_url_rule("/jobs/<int:job_id>", endpoint="get_job_detail_rest", view_func=get_job_detail, methods=["GET"])
