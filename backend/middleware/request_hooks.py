from __future__ import annotations

from flask import request
from pymongo.errors import PyMongoError

from backend.config.settings import is_allowed_origin
from backend.services.platform_service import get_store, json_error
from backend.services.rate_limit_service import check_rate_limit


def register_request_hooks(app):
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        allowed_origins = app.config.get("FC_ALLOWED_ORIGINS", set())
        if is_allowed_origin(origin, allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
            response.headers["Vary"] = "Origin"
        return response

    @app.before_request
    def handle_options_request():
        if request.method == "OPTIONS":
            return ("", 204)
        return None

    @app.before_request
    def enforce_rate_limits():
        result = check_rate_limit(app.config, request)
        if result.get("allowed"):
            return None
        response, status_code = json_error("rate_limit_exceeded", 429)
        response.headers["Retry-After"] = str(result.get("retry_after") or 60)
        return response, status_code

    @app.before_request
    def bootstrap_database():
        if request.path in {"/", "/healthz"}:
            return None
        try:
            get_store().bootstrap()
        except (PyMongoError, RuntimeError):
            return json_error("database_unavailable", 503)
        return None
