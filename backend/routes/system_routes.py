from __future__ import annotations

from flask import Blueprint

from backend.controllers.system_controller import api_session, healthcheck, index, uploaded_file


system_bp = Blueprint("system", __name__)

system_bp.get("/")(index)
system_bp.get("/api/session")(api_session)
system_bp.get("/healthz")(healthcheck)
system_bp.get("/api/uploads/<path:filename>")(uploaded_file)
