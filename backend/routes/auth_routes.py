from __future__ import annotations

from flask import Blueprint

from backend.controllers.auth_controller import login_account, login_admin_account, logout_account, register_account


auth_bp = Blueprint("auth", __name__)

auth_bp.post("/api/auth/register")(register_account)
auth_bp.post("/api/auth/login")(login_account)
auth_bp.post("/api/auth/admin/login")(login_admin_account)
auth_bp.post("/api/auth/logout")(logout_account)
auth_bp.add_url_rule("/auth/register", endpoint="register_account_rest", view_func=register_account, methods=["POST"])
auth_bp.add_url_rule("/auth/login", endpoint="login_account_rest", view_func=login_account, methods=["POST"])
auth_bp.add_url_rule("/auth/admin/login", endpoint="login_admin_account_rest", view_func=login_admin_account, methods=["POST"])
auth_bp.add_url_rule("/auth/logout", endpoint="logout_account_rest", view_func=logout_account, methods=["POST"])
