from __future__ import annotations

from flask import Blueprint

from backend.controllers.job_controller import list_jobs


jobs_bp = Blueprint("jobs", __name__)

jobs_bp.get("/api/jobs")(list_jobs)
