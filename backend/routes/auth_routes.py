from __future__ import annotations

from flask import Blueprint

from backend.controllers.auth_controller import login_account, logout_account, register_account


auth_bp = Blueprint("auth", __name__)

auth_bp.post("/api/auth/register")(register_account)
auth_bp.post("/api/auth/login")(login_account)
auth_bp.post("/api/auth/logout")(logout_account)
