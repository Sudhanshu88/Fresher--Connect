from __future__ import annotations

from flask import Blueprint

from backend.controllers.company_controller import (
    company_applications,
    company_dashboard,
    company_jobs,
    create_company_job,
    update_company_application,
    upload_company_logo,
)
from backend.middleware.auth import role_required


company_bp = Blueprint("company", __name__)

company_bp.get("/api/company/dashboard")(role_required("company")(company_dashboard))
company_bp.get("/api/company/jobs")(role_required("company")(company_jobs))
company_bp.post("/api/company/jobs")(role_required("company")(create_company_job))
company_bp.post("/api/company/logo")(role_required("company")(upload_company_logo))
company_bp.add_url_rule(
    "/jobs",
    endpoint="create_company_job_rest",
    view_func=role_required("company")(create_company_job),
    methods=["POST"],
)
company_bp.get("/api/company/applications")(role_required("company")(company_applications))
company_bp.patch("/api/company/applications/<int:application_id>")(role_required("company")(update_company_application))
