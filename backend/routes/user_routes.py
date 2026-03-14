from __future__ import annotations

from flask import Blueprint

from backend.controllers.user_controller import create_application, my_applications, update_user_profile, user_dashboard
from backend.middleware.auth import role_required


user_bp = Blueprint("user", __name__)

user_bp.get("/api/user/dashboard")(role_required("fresher")(user_dashboard))
user_bp.patch("/api/user/profile")(role_required("fresher")(update_user_profile))
user_bp.post("/api/applications")(role_required("fresher")(create_application))
user_bp.get("/api/applications/me")(role_required("fresher")(my_applications))
