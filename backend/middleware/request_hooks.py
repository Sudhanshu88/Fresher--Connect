from __future__ import annotations

from flask import request, session
from pymongo.errors import PyMongoError

from backend.config.settings import is_allowed_origin
from backend.services.platform_service import ensure_csrf_token, get_store, json_error


def register_request_hooks(app):
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        allowed_origins = app.config.get("FC_ALLOWED_ORIGINS", set())
        if is_allowed_origin(origin, allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-CSRF-Token"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
            response.headers["Vary"] = "Origin"
        return response

    @app.before_request
    def handle_options_request():
        if request.method == "OPTIONS":
            return ("", 204)
        return None

    @app.before_request
    def bootstrap_database():
        if request.path in {"/", "/healthz"}:
            return None
        try:
            get_store().bootstrap()
        except (PyMongoError, RuntimeError):
            return json_error("database_unavailable", 503)
        return None

    @app.before_request
    def protect_mutation_routes():
        ensure_csrf_token()
        if request.method in {"GET", "HEAD", "OPTIONS"}:
            return None
        if request.headers.get("X-CSRF-Token", "") != session.get("csrf_token"):
            return json_error("csrf_token_invalid", 403)
        return None
