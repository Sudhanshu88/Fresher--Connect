from __future__ import annotations

from flask import Blueprint

from backend.controllers.admin_controller import admin_dashboard, admin_jobs, admin_users, moderate_admin_job, update_admin_user
from backend.middleware.auth import role_required


admin_bp = Blueprint("admin", __name__)

admin_bp.get("/api/admin/dashboard")(role_required("admin")(admin_dashboard))
admin_bp.get("/api/admin/users")(role_required("admin")(admin_users))
admin_bp.patch("/api/admin/users/<int:user_id>")(role_required("admin")(update_admin_user))
admin_bp.get("/api/admin/jobs")(role_required("admin")(admin_jobs))
admin_bp.patch("/api/admin/jobs/<int:job_id>")(role_required("admin")(moderate_admin_job))
