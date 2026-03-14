from __future__ import annotations

from flask import request
from pymongo.errors import PyMongoError

from backend.config.settings import is_allowed_origin
from backend.services.platform_service import get_store, json_error


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
    def bootstrap_database():
        if request.path in {"/", "/healthz"}:
            return None
        try:
            get_store().bootstrap()
        except (PyMongoError, RuntimeError):
            return json_error("database_unavailable", 503)
        return None
