from __future__ import annotations

from flask import Blueprint

from backend.controllers.system_controller import api_session, create_review, healthcheck, index, list_live_updates, list_reviews, uploaded_file


system_bp = Blueprint("system", __name__)

system_bp.get("/")(index)
system_bp.get("/api/session")(api_session)
system_bp.get("/api/live-updates")(list_live_updates)
system_bp.get("/api/reviews")(list_reviews)
system_bp.post("/api/reviews")(create_review)
system_bp.get("/healthz")(healthcheck)
system_bp.get("/api/healthz")(healthcheck)
system_bp.get("/api/uploads/<path:filename>")(uploaded_file)
