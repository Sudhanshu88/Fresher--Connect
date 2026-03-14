from __future__ import annotations

from flask import Blueprint

from backend.controllers.user_controller import (
    create_application,
    my_applications,
    my_saved_jobs,
    save_job,
    unsave_job,
    update_user_profile,
    upload_resume,
    user_dashboard,
)
from backend.middleware.auth import role_required


user_bp = Blueprint("user", __name__)

user_bp.get("/api/user/dashboard")(role_required("fresher")(user_dashboard))
user_bp.patch("/api/user/profile")(role_required("fresher")(update_user_profile))
user_bp.post("/api/user/resume")(role_required("fresher")(upload_resume))
user_bp.post("/api/applications")(role_required("fresher")(create_application))
user_bp.get("/api/applications/me")(role_required("fresher")(my_applications))
user_bp.add_url_rule(
    "/apply/<int:job_id>",
    endpoint="create_application_rest",
    view_func=role_required("fresher")(create_application),
    methods=["POST"],
)
user_bp.add_url_rule(
    "/applications",
    endpoint="my_applications_rest",
    view_func=role_required("fresher")(my_applications),
    methods=["GET"],
)
user_bp.get("/api/saved-jobs")(role_required("fresher")(my_saved_jobs))
user_bp.post("/api/saved-jobs")(role_required("fresher")(save_job))
user_bp.delete("/api/saved-jobs/<int:job_id>")(role_required("fresher")(unsave_job))
